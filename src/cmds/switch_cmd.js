import cache from '/app/src/cache/index.js'
import mqtt from '/app/src/mqtt/index.js'
import { dataList } from '/app/src/data_list.js';

import updateSchedule from '/app/src/update_schedule/index.js'
import all_sensors from '/app/src/sensor_configs/index.js'

import SYSTEM_CONFIGS from '/app/config/config.json' with { type: 'json' };

const INVERTER_CONFIGS = SYSTEM_CONFIGS?.inverters;

let reset_cmds = new Map()
for(let i in INVERTER_CONFIGS){
  reset_cmds.set(`reset_bridge_${INVERTER_CONFIGS[i].inverter_num}`, INVERTER_CONFIGS[i])
  
}
async function reset_bridge(key, value){
  let inverter = reset_cmds.get(key);
  if(!inverter?.inverter_num) return;
  await mqtt.sendSensorValue(`solar_inverter/${inverter.inverter_num}/status/reset_bridge/state`, value )
  dataList.inverters[inverter?.inverter_num].reset_bridge = value
}
async function update_solar_schedule(){
  await updateSchedule.all()
  await cache.set(`update_solar_schedule`, { state: 'OFF' })
  await mqtt.sendSensorValue(`solar_inverter/schedule/update_solar_schedule/state`, 'OFF')
}

const Cmds = { enable_extended_solar: updateSchedule.gridFirst, update_solar_schedule, reset_bridge }

export default async function(key, value){
  if(!key || !value) return

  let sensor = all_sensors[key]

  if(sensor?.id) dataList[sensor.id][key] = value
  await cache.set(key, { state: value })

  if(sensor?.id && sensor?.topic) await mqtt.sendSensorValue(`solar_inverter/${sensor.id}/${sensor.topic}/state`, value )
  if(Cmds[key]) return await Cmds[key](key, value)
  await reset_bridge(key, value)
}
