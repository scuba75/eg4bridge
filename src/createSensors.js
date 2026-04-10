'use strict'
const log = require('./logger')
const mqtt = require('./mqtt')

const sensorConfig = require('./sensorConfig')
const deviceConfigs = require('./device_configs.json')

module.exports = async()=>{
  try{
    for(let i in sensorConfig){
      if(!i || !sensorConfig[i]?.topic) continue

      let info = JSON.parse(JSON.stringify(sensorConfig[i])), sensor_type = sensorConfig[i]?.sensor_type
      if(!info?.topic) continue
      if(!sensor_type) sensor_type = "sensor"

      let config_main = JSON.parse(JSON.stringify(deviceConfigs?.main))
      let config_1 = JSON.parse(JSON.stringify(deviceConfigs?.inverter1))
      let config_2 = JSON.parse(JSON.stringify(deviceConfigs?.inverter2))
      if(!config_main?.device || !config_1?.device || !config_2?.device) continue;

      config_main.state_topic = `solar_inverter/main/${info.topic}/state`
      config_main.unique_id = `solar_inverter_${info.topic}`
      config_main.name = info.name
      config_1.state_topic = `solar_inverter/1/${info.topic}/state`
      config_1.unique_id = `solar_inverter_1_${info.topic}`
      config_1.name = info.name
      config_2.state_topic = `solar_inverter/2/${info.topic}/state`
      config_2.unique_id = `solar_inverter_2_${info.topic}`
      config_2.name = info.name

      if(info.config){
        config_main = { ...config_main, ... info.config }
        config_1 = { ...config_1, ... info.config }
        config_2 = { ...config_2, ... info.config }
      }
      if(sensor_type == "binary_sensor"){

      }
      if(!config_main?.device || !config_1?.device || !config_2?.device) continue;
      if(sensor_type && info.topic){
        if(info.main) await mqtt.registerSensor(`homeassistant/${sensor_type}/solar_inverter_${info.topic}/config`, config_main)
        if(info.individual){
          await mqtt.registerSensor(`homeassistant/${sensor_type}/solar_inverter_1_${info.topic}/config`, config_1)
          await mqtt.registerSensor(`homeassistant/${sensor_type}/solar_inverter_2_${info.topic}/config`, config_2)
        }
      }
    }
    await mqtt.publish('solar_inverter/main/availability', 'online')
    await mqtt.publish('solar_inverter/1/availability', 'online')
    await mqtt.publish('solar_inverter/2/availability', 'online')
    log.info(`Created all Sensors...`)
    return true
  }catch(e){
    log.error(e)
  }
}
