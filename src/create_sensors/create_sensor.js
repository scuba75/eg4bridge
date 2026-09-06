import log from '/app/src/logger.js';
import mqtt from '/app/src/mqtt/index.js';
import cache from '/app/src/cache/index.js'
import sensorList from '/app/src/sensor_list.js'
import { dataList } from '/app/src/data_list.js';

export default async function( sensor_info, sensor_config, registerTopic ){
  if(!sensor_config || !sensor_info) return
  await mqtt.registerSensor(registerTopic, sensor_config)
  sensorList.set(sensor_config.state_topic, sensor_info.retain)
  let state_data = await cache.get(sensor_info.topic)
  if(sensor_info?.sensor_type == 'switch' && !state_data?.state) state_data = { state: 'OFF' }
  if(state_data?.state){
    if(sensor_info.id && sensor_info.topic && dataList[sensor_info.id]) dataList[sensor_info.id][sensor_info.topic] = state_data.state
    await mqtt.sendSensorValue(sensor_config.state_topic, state_data?.state)
  }
}
