import log from './logger.js';


import EG4Bridge from './eg4_bridge/index.js';
import { dataList } from './data_list.js';

import updateSensors from './update_sensors/index.js';
import updateHoldData from './update_hold_data.js';
//import automation from './automation/index.js'

//import SENSOR_CONFIGS from './sensor_configs/index.js';
import SYSTEM_CONFIGS from '/app/config/config.json' with { type: 'json' };

const INVERTER_CONFIGS = SYSTEM_CONFIGS?.inverters;
const POWER_CONFIGS = SYSTEM_CONFIGS?.max_powers;

let INPUT_UPDATE_MS = +(process.env.INPUT_UPDATE_MS || 5000), HOLD_UPDATE_MS = +(process.env.HOLD_UPDATE_MS || 10000), INVERTERS = {}, INVERTERS_STATUS;

function init(){
  try {
    if (!INVERTER_CONFIGS || INVERTER_CONFIGS?.length == 0) {
      log.error(`Inverter Config not defined...`);
      setTimeout(init, 5000);
      return;
    }
    for (let i in POWER_CONFIGS) {
      if (!i || !POWER_CONFIGS[i]) continue;
      dataList.main[`${i}_max`] = POWER_CONFIGS[i];
    }
    for (let i in INVERTER_CONFIGS) {
      if (!i || !INVERTER_CONFIGS[i]?.host) continue;
      let inverter_num = +(+i + 1);
      INVERTERS[inverter_num] = new EG4Bridge({
        ...INVERTER_CONFIGS[i],
        inverter_num: inverter_num,
        updateIntervalMs: INPUT_UPDATE_MS,
        holdIntervalMs: HOLD_UPDATE_MS
      });
      dataList.inverters[inverter_num] = { serial: INVERTER_CONFIGS[i].inverterSerial, inverter_num: inverter_num };

      INVERTERS[inverter_num].on('log', (e) => {
        if (log[e?.level]) {
          log[e.level](`[inverter_${e.inverter_num}] ${e.msg}`)
        } else {
          console.log(`[${e.level}][inverter_${e.inverter_num}] ${e.msg}`);
        }
      });
      INVERTERS[inverter_num].on('scan_status', (d) => log.error(`[inverter_${d.inverter_num}][scan] ${d.msg}`));

      INVERTERS[inverter_num].on('connected', (d) => log.info(`Inverter ${d.inverter_num} Connected!`));

      INVERTERS[inverter_num].on('data', (d) => {
        if (!d?.data || !d?.inverter_num) return;
        if (!dataList.inverters[d?.inverter_num]) return;

        updateSensors(d.inverter_num, d.data);
      });
      if (inverter_num == 1) {
        log.info(`Setting up hold_data reporting for Inverter ${inverter_num}...`);

        INVERTERS[inverter_num].on('hold_data', async (d) => {
          updateHoldData(d, inverter_num, INVERTERS)
        });

      }
    }
    INVERTERS_STATUS = true;
  } catch (e) {
    setTimeout(init, 5000);
    log.error(e);
  }
};
init();

function start(){
  try {
    for (let i in INVERTERS) {
      if (!INVERTERS[i]) continue;
      INVERTERS[i].start();
    }
    //automation.start()
    return true;
  } catch (e) {
    log.error(e);
  }
};
function status(){
  return INVERTERS_STATUS;
};
export default { start, status };
