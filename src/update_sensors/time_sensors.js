import mqtt from '/app/src/mqtt/index.js'
import { dataList } from '/app/src/data_list.js'
import { main_sensors, ha_switches } from '/app/src/create_sensors/time_config.js'

export default async function(){
  for(let s of main_sensors){
    let value = dataList.schedule[s.state_topic]
    if(value) await mqtt.sendSensorValue(`solar_inverter/main/${s.state_topic}/state`, value)
  }
  for(let s of ha_switches){
    let value = dataList.schedule[s.state_topic]
    if(value) await mqtt.sendSensorValue(`solar_inverter/main/${s.state_topic}/state`, value)
  }
}
