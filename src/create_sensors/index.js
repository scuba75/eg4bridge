import log from '/app/src/logger.js';
import createMain from './main.js'
import energy from './energy.js';
import schedule from './schedule.js';
import microInverters from './micro_inverters.js'
import updateSchedule from '/app/src/update_schedule/index.js'

import { battery_sensors, grid_sensors, load_sensors, pv_sensors, status_sensors } from '/app/src/sensor_configs/index.js'

import CONFIGS from '/app/data/config.json' with { type: 'json' };

const INVERTER_CONFIGS = CONFIGS?.inverters;

export default async function(){
  let status = await energy(INVERTER_CONFIGS);
  if(status) status = await microInverters();
  if(status) status = await schedule();
  if(status) status = await createMain(INVERTER_CONFIGS, battery_sensors);
  if(status) status = await createMain(INVERTER_CONFIGS, grid_sensors);
  if(status) status = await createMain(INVERTER_CONFIGS, load_sensors);
  if(status) status = await createMain(INVERTER_CONFIGS, pv_sensors);
  if(status) status = await createMain(INVERTER_CONFIGS, status_sensors);
  if(status) await updateSchedule.all()
  return status
}
