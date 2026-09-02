import cache from '/app/src/cache/index.js'
import mqtt from '/app/src/mqtt/index.js'
import { dataList } from '/app/src/data_list.js';

import updateSchedule from '/app/src/update_schedule/index.js'
import all_sensors from '/app/src/sensor_configs/index.js'

async function update_solar_schedule(){
  await updateSchedule.all()
  await cache.set(`update_solar_schedule`, { state: 'OFF' })
  await mqtt.sendSensorValue(`solar_inverter/schedule/update_solar_schedule/state`, 'OFF')
}

const Cmds = { enable_extended_solar: updateSchedule.gridFirst, update_solar_schedule }

export default async function(key, value){
  if(!key || !value) return

  let sensor = all_sensors[key]

  if(sensor?.id) dataList[sensor.id][key] = value
  await cache.set(key, { state: value })

  if(sensor?.id && sensor?.topic) await mqtt.sendSensorValue(`solar_inverter/${sensor.id}/${sensor.topic}/state`, value )
  if(Cmds[key]) await Cmds[key](value)
}
