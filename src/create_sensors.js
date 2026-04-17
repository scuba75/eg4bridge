'use strict'
const log = require('./logger')
const mqtt = require('./mqtt')

const SENSOR_CONFIGS = require('./sensor_configs')
const INVERTER_CONFIGS = require('/app/data/config.json')?.inverters

module.exports = async()=>{
  try{
    for(let i in SENSOR_CONFIGS){
      if(!i || !SENSOR_CONFIGS[i]?.topic) continue

      let info = JSON.parse(JSON.stringify(SENSOR_CONFIGS[i])), sensor_type = SENSOR_CONFIGS[i]?.sensor_type, INVERTERS = {}
      if(!info?.topic) continue
      if(!sensor_type) sensor_type = "sensor"


      let config_main = {
        ...(info.config || {}),
        state_topic: `solar_inverter/main/${info.topic}/state`,
        unique_id: `solar_inverter_main_${info.topic}`,
        name: info.name,
        device: {
          identifiers: [`solar_inverter_main`],
          name: `Solar Inverter`
        }
      }
      let config_yesterday
      if(info.device){
        config_main.device.name = `Solar Inverter ${info.device}`
        config_main.device.via_device = 'solar_inverter_main'
        config_main.device.identifiers= [`solar_inverter_${info.device?.toLowerCase()}`]
        config_main.unique_id = `solar_inverter_energy_${info.device?.toLowerCase()}_${info.topic}`
      }
      if(info.topic?.endsWith('_daily')){
        config_main.device.name = `Solar Inverter Energy`
        config_main.device.via_device = 'solar_inverter_main'
        config_main.device.identifiers= [`solar_inverter_energy`]
        config_main.unique_id = `solar_inverter_energy_${info.topic}`
        let yesterday_topic = info.topic?.replace('_daily', '_yesterday')
        config_yesterday = {
          ...(info.config || {}),
          state_topic: `solar_inverter/main/${yesterday_topic}/state`,
          unique_id: `solar_inverter_energy_${yesterday_topic}`,
          name: info.name?.replace('(Daily)', '(Yesterday)'),
          device: {
            identifiers: [`solar_inverter_energy`],
            name: `Solar Inverter Energy`,
            via_device: 'solar_inverter_main'
          }
        }
      }
      for(let d in INVERTER_CONFIGS){
        let num = +d + 1
        INVERTERS[num] = {
          ...(info.config || {}),
          state_topic: `solar_inverter/${num}/${info.topic}/state`,
          unique_id: `solar_inverter_${num}_${info.topic}`,
          name: info.name,
          device: {
            identifiers: [`solar_inverter_${num}`],
            name: `Solar Inverter ${num}`,
            via_device: 'solar_inverter_main'
          }
        }
      }

      if(sensor_type && info.topic){
        if(info.main){
          await mqtt.registerSensor(`homeassistant/${sensor_type}/solar_inverter_${info.topic}/config`, config_main)
          if(config_yesterday?.state_topic) await mqtt.registerSensor(`homeassistant/${sensor_type}/solar_inverter_${info.topic?.replace('_daily', '_yesterday')}/config`, config_yesterday)
        }

        if(info.individual){
          for(let d in INVERTERS){
            if(!d || !INVERTERS[d]?.state_topic) continue
            await mqtt.registerSensor(`homeassistant/${sensor_type}/solar_inverter_${d}_${info.topic}/config`, INVERTERS[d])
          }
        }
      }
    }
    log.info(`Created all Sensors...`)
    return true
  }catch(e){
    log.error(e)
  }
}
