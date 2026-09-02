import { dataList } from '/app/src/data_list.js'
import mqtt from '/app/src/mqtt/index.js'
import cache from '/app/src/cache/index.js'

import updateSchedule from '/app/src/update_schedule/index.js'

async function enable(){
  if(dataList.schedule.enable_extended_solar == 'ON') return
  dataList.schedule.enable_extended_solar = 'ON'
  await cache.set('enable_extended_solar', { state: 'ON' })
  await updateSchedule.gridFirst()
  await mqtt.sendSensorValue(`solar_inverter/schedule/enable_extended_solar/state`, 'ON')
}
async function disable(){
  if(dataList.schedule.enable_extended_solar == 'OFF') return
  dataList.schedule.enable_extended_solar = 'OFF'
  await cache.set('enable_extended_solar', { state: 'OFF' })
  await updateSchedule.gridFirst()
  await mqtt.sendSensorValue(`solar_inverter/schedule/enable_extended_solar/state`, 'OFF')
}
export default { enable, disable }
