import log from '/app/src/logger.js'
import EG4Bridge from 'eg4-bridge';
import { dataList } from './data_list.js';

import automation from './automation/index.js'
import processHoldData from './process_hold_data.js';
import updateSensors from './update_sensors/index.js';

import SYSTEM_CONFIGS from '/app/config/config.json' with { type: 'json' };

const INVERTER_CONFIGS = SYSTEM_CONFIGS?.inverters;
const POWER_CONFIGS = SYSTEM_CONFIGS?.max_powers;

let INPUT_UPDATE_MS = +(process.env.INPUT_UPDATE_MS || 5000), HOLD_UPDATE_MS = +(process.env.HOLD_UPDATE_MS || 10000), INVERTERS = {}, INVERTERS_STATUS;

function queueWrite(inv_num, register, value){
  if(!inv_num || !INVERTERS[inv_num] || !register) return
  INVERTERS[inv_num].queueWrite(register, value)
}
function init(){
  try{
    if (!INVERTER_CONFIGS || INVERTER_CONFIGS?.length == 0) {
      log.error(`Inverter Config not defined...`);
      setTimeout(init, 5000);
      return;
    }
    for (let i in POWER_CONFIGS) {
      if (!i || !POWER_CONFIGS[i]) continue;
      dataList.main[`${i}_max`] = POWER_CONFIGS[i];
    }
    for(let i of INVERTER_CONFIGS){
      INVERTERS[i.inverter_num] = new EG4Bridge({
        ...i,
        updateIntervalMs: INPUT_UPDATE_MS,
        holdIntervalMs: HOLD_UPDATE_MS
      });
      dataList.inverters[i.inverter_num] = { serial: i.inverterSerial, inverter_num: i.inverter_num };
      INVERTERS[i.inverter_num].on('log', (e) => {
        if (log[e?.level]) {
          log[e.level](`[inverter_${e.inverter_num}] ${e.msg}`)
        } else {
          console.log(`[${e.level}][inverter_${e.inverter_num}] ${e.msg}`);
        }
      });
      INVERTERS[i.inverter_num].on('scan_status', (d) => log.error(`[inverter_${d.inverter_num}][scan] ${d.msg}`));
      INVERTERS[i.inverter_num].on('connected', (d) => log.info(`Inverter ${d.inverter_num} Connected!`));
      INVERTERS[i.inverter_num].on('data', (d) => {
        if (!d?.data || !d?.inverter_num) return;
        if (!dataList.inverters[d?.inverter_num]) return;

        updateSensors(d.inverter_num, d.data);
      });
      INVERTERS[i.inverter_num].on('hold_data', async (d) => {
        if(i.inverter_num !== SYSTEM_CONFIGS.write_inverter) return
        processHoldData(d, i.inverter_num, queueWrite)
      });
      INVERTERS_STATUS = true;
    }
  }catch(e){
    log.error(e)
    setTimeout(init, 5000)
  }
};
init();

function start(){
  try {
    for (let i in INVERTERS) {
      if (!INVERTERS[i]) continue;
      INVERTERS[i].start();
    }
    automation.start()
    return true;
  } catch (e) {
    log.error(e);
  }
};
function status(){
  return INVERTERS_STATUS;
};
export default { start, status };
