'use strict'
const log = require('./logger')
const { dataList } = require('./dataList')
const mqtt = require('./mqtt')
const cache = require('./cache')
const schedule = require('./schedule')

const sensorConfig = require('./sensorConfig.json')
const updateSensors = require('./updateSensors')

let INVERTER1_IP = process.env.INVERTER1_IP, INVERTER1_PORT = (process.env.INVERTER1_PORT || 8000), INVERTER1_DONGLE_SN = process.env.INVERTER1_DONGLE_SN, INVERTER1_SN = process.env.INVERTER1_SN
let INVERTER2_IP = process.env.INVERTER2_IP, INVERTER2_PORT = (process.env.INVERTER2_PORT || 8000), INVERTER2_DONGLE_SN = process.env.INVERTER2_DONGLE_SN, INVERTER2_SN = process.env.INVERTER2_SN

let INPUT_UPDATE_MS = +(process.env.INPUT_UPDATE_MS || 5000), HOLD_UPDATE_MS = +(process.env.HOLD_UPDATE_MS || 10000)

let MASTER_INVERTER = 1

const { EG4Bridge } = require('./eg4Bridge');

const inverter1 = new EG4Bridge({
  host: INVERTER1_IP,          // or leave blank and use scanDongle()
  port: INVERTER1_PORT,
  dongleSerial: INVERTER1_DONGLE_SN,    // 10 chars
  inverterSerial: INVERTER1_SN,  // 10 chars
  updateIntervalMs: INPUT_UPDATE_MS,
  holdIntervalMs: HOLD_UPDATE_MS,
});

const inverter2 = new EG4Bridge({
  host: INVERTER2_IP,          // or leave blank and use scanDongle()
  port: INVERTER2_PORT,
  dongleSerial: INVERTER2_DONGLE_SN,    // 10 chars
  inverterSerial: INVERTER2_SN,  // 10 chars
  updateIntervalMs: INPUT_UPDATE_MS,
  holdIntervalMs: HOLD_UPDATE_MS,
});

inverter1.on('log', (e) => {
  if(log[e?.level]){
    log[e.level](`[inverter1] ${e.msg}`)
  }else{
    console.log(`[${e.level}][inverter1] ${e.msg}`)
  }
})
inverter1.on('scan_status', (s) => log.error(`[scan][inverter1] ${s}`));

inverter1.on('connected', () => log.info('Inverter 1 Connected!'));

inverter1.on('data', (d)=>{
  if(d?.master_slave == 1) MASTER_INVERTER = 1
  for(let i in d) {
    if(!i || (!d[i] && +(d[i] != 0))) continue;

    if(!dataList["1"]) dataList["1"] = {}
    dataList["1"][i] = d[i]
  }
  updateSensors(1, 2, MASTER_INVERTER, d)
})
inverter1.on('hold_data', async(d)=>{
  if(!d?.schedule) return;
  for(let i in d.schedule){
    if(!i || !d.schedule[i]?.raw) continue

    let decodedValue = schedule.decode(d.schedule[i].raw)
    if(!decodedValue) continue;

    if(!dataList.schedule) dataList.schedule = {}
    dataList.schedule[i] = decodedValue

    let topic = sensorConfig[i]?.topic
    if(topic) mqtt.publish(`solar_inverter/main/${topic}/state`, decodedValue?.toString())

    let desired = cache.get(i)
    if(!desired?.raw) await cache.set(i, { raw: d.schedule[i].raw, decodedValue: decodedValue, register: d.schedule[i].register })
    if(desired?.decodedValue && topic) mqtt.publish(`solar_inverter/main/${topic}_desired/state`, desired?.decodedValue?.toString())
    if(desired?.raw != d.schedule[i].raw && d.schedule[i].register > 0 && desired.raw >= 0) inverter1.queueWrite(d.schedule[i].register, desired.raw)
  }
});

inverter2.on('log', (e) => {
  if(log[e?.level]){
    log[e.level](`[inverter2] ${e.msg}`)
  }else{
    console.log(`[${e.level}][inverter2] ${e.msg}`)
  }
})
inverter2.on('scan_status', (s) => log.error(`[scan][inverter2] ${s}`));

inverter2.on('connected', () => log.info('Inverter 2 Connected!'));

inverter2.on('data', (d)=>{
  if(d?.master_slave == 1) MASTER_INVERTER = 2
  for(let i in d) {
    if(!i || (!d[i] && +(d[i]) != 0)) continue;

    if(!dataList["2"]) dataList["2"] = {}
    dataList["2"][i] = d[i]
  }
  updateSensors(2, 1, MASTER_INVERTER, d)
})

if(INVERTER1_IP) inverter1.start()
if(INVERTER2_IP) inverter2.start()
