import log from '/app/src/logger.js'
import cache from '/app/src/cache/index.js'
import mqtt from '/app/src/mqtt/index.js'
import schedule from '/app/src/mqtt/schedule.js';
import checkSummer from '/app/src/helpers/check_summer.js'

import { dataList } from '/app/src/data_list.js';

function isSummer(){
  if(dataList?.schedule?.summer_peak_hours == 'ON') return true
  if(!dataList?.schedule?.summer_peak_hours) return checkSummer()
}
export default async function(){
  let common_key = 'winter'
  if(isSummer()) common_key = 'summer'
  let charge_start_key = `grid_charge_start_${common_key}`, charge_end_key = `grid_charge_end_${common_key}`

  if(!dataList.schedule[charge_start_key] || !dataList.schedule[charge_end_key]) return

  let charge_start_desired = dataList.schedule[charge_start_key], charge_end_desired = dataList.schedule[charge_end_key]

  let start_data = { raw: schedule.encode(charge_start_desired), decodedValue: charge_start_desired, register: 68 };
  let end_data = { raw: schedule.encode(charge_end_desired), decodedValue: charge_end_desired, register: 69 };
  await cache.set('grid_charge_start', start_data)
  await cache.set('grid_charge_end', end_data)
  log.info(`Set desired value for grid_start to ${charge_start_desired} (${start_data.raw})`);
  log.info(`Set desired value for grid_end to ${charge_end_desired} (${end_data.raw})`);
}
