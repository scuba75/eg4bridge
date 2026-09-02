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
  let common_key = 'normal'
  if(dataList.schedule?.enable_extended_solar == 'ON') common_key = `extended`
  if(isSummer()){
    common_key += '_summer'
  }else{
    common_key += '_winter'
  }
  let grid_start_key = `grid_start_${common_key}`, grid_end_key = `grid_end_${common_key}`

  if(!dataList.schedule[grid_start_key] || !dataList.schedule[grid_end_key]) return

  let grid_start_desired = dataList.schedule[grid_start_key], grid_end_desired = dataList.schedule[grid_end_key]

  let start_data = { raw: schedule.encode(grid_start_desired), decodedValue: grid_start_desired, register: 152 };
  let end_data = { raw: schedule.encode(grid_end_desired), decodedValue: grid_end_desired, register: 153 };
  await cache.set('grid_first_start', start_data)
  await cache.set('grid_first_end', end_data)
  log.info(`Set desired value for grid_first_start to ${grid_start_desired} (${start_data.raw})`);
  log.info(`Set desired value for grid_first_end to ${grid_end_desired} (${end_data.raw})`);
}
