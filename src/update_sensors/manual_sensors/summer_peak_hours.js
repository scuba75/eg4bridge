import { dataList } from '/app/src/data_list.js'
import mqtt from '/app/src/mqtt/index.js'
import cache from '/app/src/cache/index.js'
import checkSummer from '/app/src/helpers/check_summer.js'

export default async function(){
  let isSummer = 'OFF'
  if(checkSummer()) isSummer = 'ON'

  if(dataList.schedule.summer_peak_hours != isSummer){
    cache.set('summer_peak_hours', { state: isSummer })
  }
  dataList.schedule.summer_peak_hours = isSummer
  await mqtt.sendSensorValue(`solar_inverter/schedule/summer_peak_hours/state`, dataList.schedule.summer_peak_hours)
}
