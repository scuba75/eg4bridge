import { dataList } from '/app/src/data_list.js'
import mqtt from '/app/src/mqtt/index.js'
import cache from '/app/src/cache/index.js'

import checkIsBetween from '/app/src/helpers/check_time_between.js'
function checkTime(){
  let grid_end = dataList.schedule.grid_first_end, grid_start = dataList.schedule.peak_end, load_shedding_start = false
  if(!grid_end || !grid_start) return
  return checkIsBetween(grid_end, grid_start, 2)
}
function getState(){
  if(checkTime()) return 'ON'
  if(dataList.main.grid_available == 'OFF') return 'ON'
  if(dataList.main.grid_importing == 'OFF') return 'ON'
  if(dataList.schedule.peak_hours == 'ON') return 'ON'
  return 'OFF'
}
export default async function(){
  let load_shedding_state = getState()
  if(dataList.schedule.load_shedding != load_shedding_state){
    cache.set('load_shedding', { state: load_shedding_state })
  }
  dataList.schedule.load_shedding = load_shedding_state
  await mqtt.sendSensorValue('solar_inverter/schedule/load_shedding/state', dataList.schedule.load_shedding)
}
