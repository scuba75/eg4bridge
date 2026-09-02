import log from '/app/src/logger.js'
import cache from '/app/src/cache/index.js'
import mqtt from '/app/src/mqtt/index.js'
import { dataList } from '/app/src/data_list.js';

import all_sensors from '/app/src/sensor_configs/index.js'

export default async function(key, value){
  let timeArray = value?.split(':')
  if(!timeArray || timeArray?.length < 2 || !cache.status()) return

  let timeValue = `${timeArray[0]}:${timeArray[1]}`, sensor = all_sensors[key]

  if(sensor?.id) dataList[sensor.id][key] = timeValue
  await cache.set(key, { state: timeValue })

  if(sensor?.id && sensor?.topic) await mqtt.sendSensorValue(`solar_inverter/${sensor.id}/${sensor.topic}/state`, timeValue )
  log.info(`Set ${key} time to ${dataList[sensor.id][key]}`)
}
