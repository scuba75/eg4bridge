'use strict'

const net = require('net');
const os = require('os');
const dns = require('dns').promises;
const EventEmitter = require('events');

const INVERTER_STATES = require('./inverter_states.json')
const WARNING_CODES = require('./warning_codes.json')
const FAULT_CODES = require('./fault_codes.json')
const POWER_COST = parseFloat(process.env.POWER_COST || "0.1044288425047438")
class EG4Bridge extends EventEmitter {
  // Protocol constants
  static LUX_TCP_TRANSLATED_DATA = 0xC2;
  static LUX_TCP_HEARTBEAT       = 0xC1;
  static LUX_FN_READ_HOLD        = 0x03;
  static LUX_FN_READ_INPUT       = 0x04;
  static LUX_FN_WRITE_SINGLE     = 0x06;
  static LUX_ACTION_WRITE        = 0x00;

  constructor(options = {}) {
    super();

    // ---- Config ----
    this.host = options.host || '';
    this.port = options.port ?? 8000;
    this.dongleSerial = options.dongleSerial || '';     // 10 chars
    this.inverterSerial = options.inverterSerial || ''; // 10 chars

    this.updateIntervalMs = options.updateIntervalMs ?? 20000;
    this.holdIntervalMs   = options.holdIntervalMs ?? 60000;

    // ---- State machine ----
    this.State = {
      DISCONNECTED: 0,
      CONNECTING:   1,
      IDLE:         2,
      POLLING_INPUT:3,
      POLLING_HOLD: 4,
      WRITING:      5,
    };
    this.state = this.State.DISCONNECTED;
    this.bankIdx = 0;
    this.awaiting = false;
    this.reqSentMs = 0;

    this.RESPONSE_TIMEOUT_MS = 4000;

    // ---- Timers ----
    this.lastInputPollMs = Date.now();
    this.lastHoldPollMs  = Date.now();
    this.lastConnectMs   = 0;
    this.initialHoldDone = false;

    // ---- TCP socket ----
    this.socket = null;
    this.connected = false;
    this._connecting = false;

    // ---- Receive buffer (stream framing) ----
    this.recvBuf = Buffer.alloc(0);
    this.RECV_MAX = 4096;

    // ---- Hold registers cache (0..239) ----
    this.holdRegs = new Uint16Array(240);

    // ---- Write queue (bounded) ----
    this.WRITE_QUEUE_MAX = options.writeQueueMax ?? 20;
    this.writeQueue = [];

    // ---- Scanning ----
    this.scanning = false;
    this.scanStartMs = 0;
    this.SCAN_TIMEOUT_MS = 30000;

    // ---- Poll tick ----
    this.tickMs = options.tickMs ?? 50;
    this._tickHandle = null;
  }

  isConfigReady() {
    return (
      !!this.host &&
      typeof this.host === 'string' &&
      this.dongleSerial?.length === 10 &&
      this.inverterSerial?.length === 10
    );
  }

  start() {
    if (this._tickHandle) return;
    this._tickHandle = setInterval(() => this.loopTick(), this.tickMs);
  }

  stop() {
    if (this._tickHandle) clearInterval(this._tickHandle);
    this._tickHandle = null;
    this.closeSocket();
  }

  reconnect() {
    this.emit('log', { level: 'info', msg: 'reconnect() called – closing socket and resetting state' });
    this.closeSocket();
    this.lastConnectMs = 0;
    this.initialHoldDone = false;
  }

  queueWrite(reg, value) {
    if (this.writeQueue.length >= this.WRITE_QUEUE_MAX) {
      this.emit('log', { level: 'warn', msg: `queueWrite: queue full (${this.WRITE_QUEUE_MAX}), dropping reg=${reg} value=${value}` });
      return false;
    }
    this.writeQueue.push({ reg: reg & 0xFFFF, value: value & 0xFFFF });
    this.emit('log', { level: 'debug', msg: `queueWrite reg=${reg} value=${value} depth=${this.writeQueue.length}` });
    return true;
  }

  getHoldRegister(reg) {
    if (reg >= 0 && reg < 240) return this.holdRegs[reg];
    return 0;
  }

  // --------------------------
  // TCP connect + socket handlers
  // --------------------------
  async startConnect() {
    if (this._connecting || this.connected) return;
    this._connecting = true;
    this.state = this.State.CONNECTING;

    try {
      // Resolve host if it’s a name
      let ip = this.host;
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(this.host)) {
        const res = await dns.lookup(this.host);
        ip = res.address;
      }

      const sock = new net.Socket();
      sock.setNoDelay(true);

      sock.on('connect', () => {
        this.connected = true;
        this._connecting = false;
        this.state = this.State.IDLE;
        this.emit('log', { level: 'info', msg: `Connected to ${this.host}:${this.port}` });
        this.emit('connected');
      });

      sock.on('data', (chunk) => {
        // Append to recv buffer, cap to avoid runaway memory if protocol breaks
        this.recvBuf = Buffer.concat([this.recvBuf, chunk]);
        if (this.recvBuf.length > this.RECV_MAX) {
          this.emit('log', { level: 'warn', msg: `Receive buffer overflow (${this.recvBuf.length}), discarding` });
          this.recvBuf = Buffer.alloc(0);
        }
      });

      sock.on('close', () => {
        this.emit('log', { level: 'warn', msg: 'Connection closed' });
        this.closeSocket();
      });

      sock.on('error', (err) => {
        this.emit('log', { level: 'warn', msg: `Socket error: ${err.message}` });
        this.closeSocket();
      });

      this.socket = sock;
      sock.connect(this.port, ip);
    } catch (e) {
      this.emit('log', { level: 'error', msg: `Connect failed: ${e.message}` });
      this.closeSocket();
    }
  }

  closeSocket() {
    if (this.socket) {
      try { this.socket.destroy(); } catch {}
    }
    this.socket = null;
    this.connected = false;
    this._connecting = false;

    this.recvBuf = Buffer.alloc(0);
    this.awaiting = false;
    this.state = this.State.DISCONNECTED;
  }

  sendBytes(buf) {
    if (!this.socket || !this.connected) return false;
    try {
      this.socket.write(buf);
      return true;
    } catch (e) {
      this.emit('log', { level: 'warn', msg: `send failed: ${e.message}` });
      this.closeSocket();
      return false;
    }
  }

  // --------------------------
  // Packet framing + parsing
  // --------------------------

  tryProcessAllPackets() {
    while (this.tryProcessOnePacket()) {}
  }

  tryProcessOnePacket() {
    const b = this.recvBuf;
    if (b.length < 6) return false;

    // Find prefix 0xA1 0x1A
    if (b[0] !== 0xA1 || b[1] !== 0x1A) {
      const idx = this._findPrefix(b);
      if (idx === -1) {
        this.recvBuf = Buffer.alloc(0);
        return false;
      }
      this.recvBuf = b.subarray(idx);
      return false;
    }

    // frame_length at bytes 4..5 (little endian)
    const frameLen = b.readUInt16LE(4);
    const total = frameLen + 6;
    if (total > this.RECV_MAX) {
      this.emit('log', { level: 'error', msg: `Packet too large (${total}), discarding buffer` });
      this.recvBuf = Buffer.alloc(0);
      return false;
    }
    if (b.length < total) return false;

    const pkt = b.subarray(0, total);
    this.processPacket(pkt);

    this.recvBuf = b.subarray(total);
    return true;
  }

  processPacket(pkt) {
    if (pkt.length < 20) return;

    const tcpFn = pkt[7];

    if (tcpFn === EG4Bridge.LUX_TCP_HEARTBEAT) {
      this.emit('log', { level: 'debug', msg: 'Heartbeat – echoing back' });
      this.sendBytes(pkt);
      return;
    }

    if (tcpFn !== EG4Bridge.LUX_TCP_TRANSLATED_DATA) {
      this.emit('log', { level: 'debug', msg: `Unknown tcp_function 0x${tcpFn.toString(16)}` });
      return;
    }

    if (pkt.length < 22) return;

    // df starts at 20, ends before CRC16 (last 2 bytes)
    const df = pkt.subarray(20, pkt.length - 2);
    const crcRecv = pkt.readUInt16LE(pkt.length - 2);
    const crcCalc = crc16Modbus(df);

    if (crcCalc !== crcRecv) {
      this.emit('log', { level: 'error', msg: `CRC mismatch calc=0x${crcCalc.toString(16)} recv=0x${crcRecv.toString(16)}` });
      return;
    }

    if (df.length < 14) return;

    const devFn = df[1];
    const reg = df.readUInt16LE(12);

    // we got a valid response
    this.awaiting = false;

    if (devFn === EG4Bridge.LUX_FN_READ_INPUT) {
      if (df.length < 15) return;
      const vlen = df[14];
      const data = df.subarray(15, 15 + vlen);
      if (data.length !== vlen) return;
      this.processReadInput(reg, data);
      this.bankIdx++;
      return;
    }

    if (devFn === EG4Bridge.LUX_FN_READ_HOLD) {
      if (df.length < 15) return;
      const vlen = df[14];
      const data = df.subarray(15, 15 + vlen);
      if (data.length !== vlen) return;
      this.processReadHold(reg, data);
      this.bankIdx++;
      return;
    }

    if (devFn === EG4Bridge.LUX_FN_WRITE_SINGLE) {
      if (df.length < 16) return;
      const value = df.readUInt16LE(14);
      this.processWriteSingle(reg, value);
      return;
    }

    this.emit('log', { level: 'debug', msg: `Unhandled device_function 0x${devFn.toString(16)}` });
  }

  processReadHold(startReg, data) {
    const count = Math.floor(data.length / 2);

    // Track what changed (optional)
    const changed = [];

    for (let i = 0; i < count; i++) {
      const reg = startReg + i;
      if (reg >= 240) break;

      const newVal = data.readUInt16LE(i * 2);
      const oldVal = this.holdRegs[reg];

      if (newVal !== oldVal) {
        this.holdRegs[reg] = newVal;
        changed.push({ reg, value: newVal, old: oldVal });
        // Optional per-register event (useful for MQTT delta publishing)
        this.emit('hold_reg', { reg, value: newVal, old: oldVal });
      }
    }

    this.emit('log', { level: 'debug', msg: `READ_HOLD reg=${startReg} count=${count} cached (${changed.length} changed)` });

    // Emit bank-level event for anyone who wants "bank complete" info
    this.emit('hold_bank', {
      startReg,
      count: Math.min(count, 240 - startReg),
      changed,                         // list of changes in this bank
      snapshot: this.holdRegs          // current full cache
    });
  }

  processWriteSingle(reg, value) {
    this.emit('log', { level: 'info', msg: `WRITE_SINGLE confirmed reg=${reg} value=${value}` });
    if (reg < 240) {
      this.holdRegs[reg] = value;
      this.emit('hold_updated', this.holdRegs);
    }
    this.state = this.State.IDLE;
  }

  processReadInput(startReg, data) {
    if (data.length < 80) {
      this.emit('log', {
        level: 'warn',
        msg: `READ_INPUT start=${startReg} too small (${data.length})`
      });
      return;
    }

    //Normalize to bank base
    if (startReg >= 0 && startReg < 40) {
      return this.processBank0(data);
    }
    if (startReg >= 40 && startReg < 80) {
      return this.processBank1(data);
    }
    if (startReg >= 80 && startReg < 120) {
      return this.processBank2(data);
    }
    if (startReg >= 120 && startReg < 160) {
      return this.processBank3(data);
    }
    if (startReg >= 160) {
      return this.processBank4(data);
    }

    this.emit('log', {
      level: 'warn',
      msg: `Unknown INPUT bank start_reg=${startReg}`
    });
  }

  processHoldDerived() {
    const now = Date.now();

    const derived = {
      schedule: {
        grid_charge_start: { raw: this.holdRegs[68], register: 68 },
        grid_charge_end: { raw: this.holdRegs[69], register: 69 },
        grid_first_start: { raw: this.holdRegs[152], register: 152 },
        grid_first_end: { raw: this.holdRegs[153], register: 153}
      }
    };

    this.emit('hold_data', derived);
  }
  // --------------------------
  // Bank decoders (little-endian)
  // --------------------------

  processBank0(buf) {
    // Helper readers
    const u16 = (o) => buf.readUInt16LE(o);
    const i16 = (o) => buf.readInt16LE(o);

    const status = u16(0);
    const pv_voltage = i16(2)  / 10.0;
    const v_pv_2 = i16(4)  / 10.0;
    const v_pv_3 = i16(6)  / 10.0;
    const battery_voltage  = i16(8)  / 10.0;

    const battery_soc = buf.readUInt8(10);
    const soh = buf.readUInt8(11);

    const internal_fault = u16(12);

    const p_pv_1 = i16(14);
    const p_pv_2 = i16(16);
    const p_pv_3 = i16(18);
    const battery_power_charge = i16(20);
    const battery_power_discharge = i16(22);

    const grid_voltage = i16(24) / 10.0;
    const v_ac_s = i16(26) / 10.0;
    const v_ac_t = i16(28) / 10.0;
    const f_ac   = i16(30) / 100.0;

    const p_inv = i16(32);
    const p_rec = i16(34);

    const rms_current = i16(36) / 100.0;
    const pf = i16(38) / 1000.0;

    const v_eps_r = i16(40) / 10.0;
    const v_eps_s = i16(42) / 10.0;
    const v_eps_t = i16(44) / 10.0;
    const f_eps   = i16(46) / 100.0;
    const p_to_eps = i16(48);
    const apparent_eps_power = i16(50);

    const p_to_grid = i16(52);
    const grid_power_importing = i16(54);

    const pv_energy_daily = i16(56) / 10.0;
    const e_pv_2_day = i16(58) / 10.0;
    const e_pv_3_day = i16(60) / 10.0;
    const e_inv_day  = i16(62) / 10.0;
    const ac_charge_energy_daily  = i16(64) / 10.0;
    const battery_energy_charge_daily  = i16(66) / 10.0;
    const battery_energy_discharge_daily = i16(68) / 10.0;
    const e_eps_day  = i16(70) / 10.0;
    const e_to_grid_day = i16(72) / 10.0;
    const grid_energy_daily = i16(74) / 10.0;

    const v_bus_1 = i16(76) / 10.0;
    const v_bus_2 = i16(78) / 10.0;

    const pv_power = p_pv_1 + p_pv_2 + p_pv_3;

    const home_live = grid_power_importing - p_rec + p_inv - p_to_grid;
    const home_day  = (grid_energy_daily - ac_charge_energy_daily + e_inv_day - e_to_grid_day);

    const status_text = INVERTER_STATES[status] || "Unknown"

    const battery_power = (battery_power_discharge > 0) ? -battery_power_discharge : battery_power_charge

    const battery_energy_charge_solar_daily = battery_energy_charge_daily - ac_charge_energy_daily

    const load_energy_solar_daily = (pv_energy_daily > battery_energy_charge_solar_daily ) ? (pv_energy_daily - battery_energy_charge_solar_daily):0
    const load_energy_grid_daily = (grid_energy_daily > ac_charge_energy_daily) ? (grid_energy_daily - ac_charge_energy_daily):0
    const load_energy_daily = load_energy_solar_daily + load_energy_grid_daily
    // Emit raw + derived fields
    const payload = {
      status, status_text,
      pv_voltage, battery_voltage,
      battery_soc, pv_power, battery_power,
      battery_power_charge, battery_power_discharge,
      grid_voltage, grid_power_importing,
      pv_energy_daily, ac_charge_energy_daily,
      battery_energy_charge_daily, battery_energy_discharge_daily,
      grid_energy_daily, battery_energy_charge_solar_daily, load_energy_daily,
      load_energy_solar_daily, load_energy_grid_daily,
      pv_current: (pv_voltage > 0) ? (Math.round((p_pv_1 / pv_voltage) * 100) / 100) : 0,
      grid_current: (grid_voltage > 0) ? (Math.round((grid_power_importing / grid_voltage) * 100) / 100) : 0,
      battery_current: (battery_voltage > 0) ? (Math.round((battery_power / battery_voltage) * 100) / 100) : 0,
      battery_charging: (battery_power_charge > 0) ? "ON":"OFF",
      battery_discharging: (battery_power_discharge > 50) ? "ON":"OFF",
      grid_importing: (grid_power_importing > 100) ? "ON":"OFF",
      grid_available: (grid_voltage > 100) ? "ON":"OFF",
      battery_energy_cost_daily: (Math.round((ac_charge_energy_daily * POWER_COST) * 100) / 100),
      grid_energy_cost_daily: (Math.round((grid_energy_daily * POWER_COST) * 100) / 100),
      load_energy_cost_daily: (Math.round((load_energy_grid_daily * POWER_COST) * 100) / 100)
    };

    this.emit('data', payload);
  }

  processBank1(buf) {
    const i32 = (o) => buf.readInt32LE(o);
    const u32 = (o) => buf.readUInt32LE(o);
    const i16 = (o) => buf.readInt16LE(o);

    const e_pv_1_all = i32(0) / 10.0;
    const e_pv_2_all = i32(4) / 10.0;
    const e_pv_3_all = i32(8) / 10.0;

    const e_inv_all  = i32(12) / 10.0;
    const e_rec_all  = i32(16) / 10.0;
    const e_chg_all  = i32(20) / 10.0;
    const e_dischg_all = i32(24) / 10.0;
    const e_eps_all  = i32(28) / 10.0;

    const e_to_grid_all = i32(32) / 10.0;
    const e_to_user_all = i32(36) / 10.0;

    const active_fault   = u32(40);
    const active_warning = u32(44);

    const t_inner = i16(48);
    const temperature = i16(50);
    const t_rad_2 = i16(52);
    const t_bat   = i16(54);

    const uptime  = u32(60);

    const home_total = (e_to_user_all - e_rec_all + e_inv_all - e_to_grid_all);

    this.emit('data', {
      active_fault, active_warning, temperature,
      active_fault_text: FAULT_CODES[active_fault] || 'Unknown',
      active_warning_text: WARNING_CODES[active_warning] || 'Unknown'
    });
  }

  processBank2(buf) {
    const i16 = (o) => buf.readInt16LE(o);
    const u16 = (o) => buf.readUInt16LE(o);

    const max_chg_curr = i16(2) / 10.0;
    const max_dischg_curr = i16(4) / 10.0;
    const charge_volt_ref = i16(6) / 10.0;
    const dischg_cut_volt  = i16(8) / 10.0;

    const bat_status_inv = i16(30);
    const bat_count = i16(32);
    const bat_capacity = i16(34);

    const bat_current = i16(36) / 10.0;

    const max_cell_volt = i16(42) / 1000.0;
    const min_cell_volt = i16(44) / 1000.0;

    // temps are signed tenth-deg in your C++; readInt16LE already handles sign
    const max_cell_temp = i16(46) / 10.0;
    const min_cell_temp = i16(48) / 10.0;

    const battery_cycle_count = u16(52);

    const reg113 = u16(66);

    const master_slave     =  reg113        & 0x03;
    const phaseBits    = (reg113 >> 2)  & 0x03;
    const orderBits    = (reg113 >> 4)  & 0x03;
    const parallelNum  = (reg113 >> 8)  & 0xFF;

    const role =
      master_slave === 1 ? 'Master' :
      master_slave === 2 ? 'Slave'  :
      'Unknown';

    const phase =
      phaseBits === 1 ? 'R' :
      phaseBits === 2 ? 'S' :
      phaseBits === 3 ? 'T' :
        'Unknown';

    const p_load2 = i16(70);

    const bs = (bat_status_inv >= 0 && bat_status_inv < 17) ? bat_status_inv : 16;

    this.emit('data', {
      battery_cycle_count, master_slave,
      battery_cycle_count, role
    });
  }

  processBank3(buf) {
    const i16 = (o) => buf.readInt16LE(o);

    const gen_input_volt = i16(2) / 10.0;
    const gen_input_freq = i16(4) / 100.0;
    let gen_power_watt   = i16(6);
    if (gen_power_watt < 125) gen_power_watt = 0; // like your C++

    const gen_power_day  = i16(8) / 10.0;
    const gen_power_all  = i16(10) / 10.0;

    const eps_L1_volt = i16(14) / 10.0;
    const eps_L2_volt = i16(16) / 10.0;
    const eps_L1_watt = i16(18);
    const eps_L2_watt = i16(20);
    /*
    this.emit('data', {

    });
    */
  }

  processBank4(buf) {
    const i16 = (o) => buf.readInt16LE(o);
    const load_power = i16(20);
    const eload_day    = i16(22) / 10.0;
    const e_load_all_l  = i16(24) / 10.0;

    this.emit('data', { load_power });
  }

  // --------------------------
  // Packet builders (same shape as your C++)
  // --------------------------

  buildHeader(dataLength) {
    const fl = dataLength + 14; // frame_length
    const pkt = Buffer.alloc(20 + dataLength + 2); // header + data + crc
    pkt[0] = 0xA1; pkt[1] = 0x1A;
    pkt[2] = 0x02; pkt[3] = 0x00;
    pkt.writeUInt16LE(fl, 4);
    pkt[6] = 0x01;
    pkt[7] = EG4Bridge.LUX_TCP_TRANSLATED_DATA;

    // dongle 10 bytes (ASCII)
    pkt.fill(0x00, 8, 18);
    pkt.write(this.dongleSerial, 8, 10, 'ascii');

    pkt.writeUInt16LE(dataLength, 18);
    return pkt;
  }

  sendReadInput(startReg, count = 40) {
    const pkt = this.buildHeader(18);
    const df = pkt.subarray(20, 20 + 18);

    df[0] = EG4Bridge.LUX_ACTION_WRITE;
    df[1] = EG4Bridge.LUX_FN_READ_INPUT;
    df.fill(0x00, 2, 12);
    df.write(this.inverterSerial, 2, 10, 'ascii');
    df.writeUInt16LE(startReg, 12);
    df.writeUInt16LE(count, 14);

    const crc = crc16Modbus(df.subarray(0, 16));
    pkt.writeUInt16LE(crc, 20 + 16);

    this.emit('log', { level: 'debug', msg: `READ_INPUT reg=${startReg} count=${count}` });
    this.sendBytes(pkt);
  }

  sendReadHold(startReg, count = 40) {
    const pkt = this.buildHeader(18);
    const df = pkt.subarray(20, 20 + 18);

    df[0] = EG4Bridge.LUX_ACTION_WRITE;
    df[1] = EG4Bridge.LUX_FN_READ_HOLD;
    df.fill(0x00, 2, 12);
    df.write(this.inverterSerial, 2, 10, 'ascii');
    df.writeUInt16LE(startReg, 12);
    df.writeUInt16LE(count, 14);

    const crc = crc16Modbus(df.subarray(0, 16));
    pkt.writeUInt16LE(crc, 20 + 16);

    this.emit('log', { level: 'debug', msg: `READ_HOLD reg=${startReg} count=${count}` });
    this.sendBytes(pkt);
  }

  sendWriteSingle(reg, value) {
    const pkt = this.buildHeader(18);
    const df = pkt.subarray(20, 20 + 18);

    df[0] = EG4Bridge.LUX_ACTION_WRITE;
    df[1] = EG4Bridge.LUX_FN_WRITE_SINGLE;
    df.fill(0x00, 2, 12);
    df.write(this.inverterSerial, 2, 10, 'ascii');
    df.writeUInt16LE(reg, 12);
    df.writeUInt16LE(value, 14);

    const crc = crc16Modbus(df.subarray(0, 16));
    pkt.writeUInt16LE(crc, 20 + 16);

    this.emit('log', { level: 'info', msg: `WRITE_SINGLE reg=${reg} value=${value}` });
    this.sendBytes(pkt);
  }

  loopTick() {
    const now = Date.now();

    // Watchdog for scanning
    if (this.scanning && (now - this.scanStartMs > this.SCAN_TIMEOUT_MS)) {
      this.scanning = false;
      this.emit('scan_status', 'Error: scan timeout');
    }

    // Skip normal polling during scan
    if (this.scanning) return;

    // Config guard
    if (!this.isConfigReady()) {
      if (now - this.lastConnectMs >= 10000) {
        this.lastConnectMs = now;
        this.emit('log', { level: 'warn', msg: 'Config incomplete – waiting for host/dongle/inverter serial' });
      }
      return;
    }

    // Handle disconnection / reconnect
    if (this.state === this.State.DISCONNECTED) {
      if (now - this.lastConnectMs >= 10000) {
        this.lastConnectMs = now;
        this.emit('log', { level: 'info', msg: `Connecting to ${this.host}:${this.port}…` });
        this.startConnect();
      }
      return;
    }

    // Wait for async connect to complete
    if (this.state === this.State.CONNECTING) {
      // Node socket will flip to connected via events
      // timeout handled here:
      if (this._connecting && now - this.lastConnectMs > 10000) {
        this.emit('log', { level: 'warn', msg: 'Connect timed out' });
        this.closeSocket();
      }
      return;
    }

    // Connected – parse incoming packets already accumulated
    this.tryProcessAllPackets();

    // Response timeout guard
    if (this.awaiting && (now - this.reqSentMs > this.RESPONSE_TIMEOUT_MS)) {
      this.emit('log', { level: 'warn', msg: `Response timeout (bank ${this.bankIdx})` });
      this.awaiting = false;
      this.bankIdx++;

      if (this.state === this.State.POLLING_INPUT && this.bankIdx >= 5) {
        this.state = this.State.IDLE;
      } else if (this.state === this.State.POLLING_HOLD && this.bankIdx >= 6) {
        this.state = this.State.IDLE;
        this.initialHoldDone = true;
      } else if (this.state === this.State.WRITING) {
        this.state = this.State.IDLE;
      }
    }

    if (this.awaiting) return;

    // State transitions
    switch (this.state) {
      case this.State.IDLE: {
        if (this.writeQueue.length > 0) {
          const cmd = this.writeQueue.shift();
          this.sendWriteSingle(cmd.reg, cmd.value);
          this.state = this.State.WRITING;
          this.awaiting = true;
          this.reqSentMs = now;
          return;
        }

        if (!this.initialHoldDone) {
          this.bankIdx = 0;
          this.state = this.State.POLLING_HOLD;
        } else if (now - this.lastInputPollMs >= this.updateIntervalMs) {
          this.lastInputPollMs = now;
          this.bankIdx = 0;
          this.state = this.State.POLLING_INPUT;
        } else if (now - this.lastHoldPollMs >= this.holdIntervalMs) {
          this.lastHoldPollMs = now;
          this.bankIdx = 0;
          this.state = this.State.POLLING_HOLD;
        }
        break;
      }

      case this.State.POLLING_INPUT: {
        const INPUT_BANKS = [0, 40, 80, 120, 160];
        if (this.bankIdx < 5) {
          this.sendReadInput(INPUT_BANKS[this.bankIdx], 40);
          this.awaiting = true;
          this.reqSentMs = now;
        } else {
          this.emit('log', { level: 'debug', msg: 'Input poll cycle complete.' });
          this.state = this.State.IDLE;
        }
        break;
      }

      case this.State.POLLING_HOLD: {
        if (this.bankIdx < 6) {
          this.sendReadHold(this.bankIdx * 40, 40);
          this.awaiting = true;
          this.reqSentMs = now;
        } else {
          this.emit('log', { level: 'debug', msg: 'Hold poll cycle complete.' });
          this.initialHoldDone = true;
          this.lastHoldPollMs = now;
          this.processHoldDerived();
          this.emit('hold_updated', this.holdRegs);
          this.state = this.State.IDLE;
        }
        break;
      }

      default:
        break;
    }
  }
  // --------------------------
  // Scan helpers
  // --------------------------

  _getLocalIPv4() {
    // returns {a,b,c,d} for the first non-internal IPv4
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const addr of (ifaces[name] || [])) {
        if (addr.family === 'IPv4' && !addr.internal) {
          const parts = addr.address.split('.').map(n => parseInt(n, 10));
          if (parts.length === 4) return { a: parts[0], b: parts[1], c: parts[2], d: parts[3] };
        }
      }
    }
    return null;
  }

  _probeHostPort(ip, port, timeoutMs) {
    return new Promise((resolve) => {
      const sock = new net.Socket();
      let done = false;

      const finish = (ok) => {
        if (done) return;
        done = true;
        try { sock.destroy(); } catch {}
        resolve(ok);
      };

      sock.setTimeout(timeoutMs);
      sock.once('connect', () => finish(true));
      sock.once('timeout', () => finish(false));
      sock.once('error', () => finish(false));

      sock.connect(port, ip);
    });
  }

  _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  _findPrefix(buf) {
    // find 0xA1 0x1A
    for (let i = 1; i < buf.length - 1; i++) {
      if (buf[i] === 0xA1 && buf[i + 1] === 0x1A) return i;
    }
    return -1;
  }
}

// CRC-16/Modbus (same logic as your C++)
function crc16Modbus(buffer) {
  let crc = 0xFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      const lsb = crc & 1;
      crc >>= 1;
      if (lsb) crc ^= 0xA001;
    }
  }
  return crc & 0xFFFF;
}

module.exports = { EG4Bridge };
