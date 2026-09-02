import { dataList } from '/app/src/data_list.js'
import mqtt from '/app/src/mqtt/index.js'
import cache from '/app/src/cache/index.js'

import extendedSolar from '/app/src/helpers/extended_solar.js'
import checkIsBetween from '/app/src/helpers/check_time_between.js'

export default async function(){
  let battery_ac_charged = dataList.schedule?.battery_ac_charged || 'OFF'
  if(checkIsBetween('03:00', '03:05', 2)) battery_ac_charged = 'OFF'
  let ac_charge_power = dataList.main?.ac_charge_power || 0
  if(ac_charge_power > 2000) battery_ac_charged = 'ON'

  if(dataList.schedule?.battery_ac_charged != battery_ac_charged){
    cache.set('battery_ac_charged', { state: battery_ac_charged })
  }
  dataList.schedule.battery_ac_charged = battery_ac_charged
  await mqtt.sendSensorValue('solar_inverter/schedule/battery_ac_charged/state', dataList.schedule.battery_ac_charged)

  if(dataList.schedule.battery_ac_charged == 'ON' && dataList.schedule.enable_extended_solar == 'ON'){
    await extendedSolar.disable();
  }
}
