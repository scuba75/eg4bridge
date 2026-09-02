import log from '/app/src/logger.js'
import mqtt from '/app/src/mqtt/index.js'
import cache from '/app/src/cache/index.js'
import { dataList } from '/app/src/data_list.js'

import checkIsBetween from '/app/src/helpers/check_time_between.js'

export default async function(){
  let peak_start = dataList.schedule?.peak_start, peak_end = dataList.schedule?.peak_end, peak_hours = 'OFF'
  if(!peak_start || !peak_end) return

  let isBetween = checkIsBetween(peak_start, peak_end, 5)
  if(isBetween) peak_hours = 'ON'
  if(dataList.schedule.peak_hours != peak_hours){
    dataList.schedule.peak_hours = peak_hours
    await cache.set('peak_hours', { state: peak_hours })
  }
  await mqtt.sendSensorValue(`solar_inverter/schedule/peak_hours/state`, dataList.schedule.peak_hours)
}
