import log from '/app/src/logger.js'
import createSensor from './create_sensor.js'

let sensor_device = {
  name: `Solar Inverter`,
  identifiers: [`solar_inverter_main`]
}
async function registerInverter(inv_num, info){
  if(!inv_num || !info) return
  let sensor_config = {
    state_topic: `solar_inverter/${inv_num}/${info.id}/${info.topic}/state`,
    unique_id: `${info.id}_${inv_num}_${info.topic}`,
    name: info.name,
    device: {
      identifiers: [`solar_inverter_${inv_num}`],
      name: `Solar Inverter ${inv_num}`,
      via_device: 'solar_inverter_main'
    }
  }
  if(info.command) sensor_config.command_topic = `solar_inverter/set/${info.id}_cmd/${info.topic}`
  if(info.config) sensor_config = { ...sensor_config, ...info.config }
  await createSensor(info, sensor_config, `homeassistant/${info.sensor_type || 'sensor'}/solar_inverter_${info.id}_${inv_num}/${info.topic}/config`)
}
export default async function(INVERTER_CONFIGS = [], SENSOR_LIST){
  try{
    let SENSOR_ID
    if(!INVERTER_CONFIGS || INVERTER_CONFIGS?.length == 0) return
    if(!SENSOR_LIST) return
    let array = Object.values(SENSOR_LIST)
    for(let s of array){
      if(!s.id) continue
      if(!SENSOR_ID) SENSOR_ID = s.id
      if(s.main){
        let sensor_config = {
          name: s.name,
          state_topic: `solar_inverter/${s.id}/${s.topic}/state`,
          unique_id: `${s.id}_${s.topic}`,
          device: JSON.parse(JSON.stringify(sensor_device))
        }
        if(s.command) sensor_config.command_topic = `solar_inverter/set/${s.id}_cmd/${s.topic}`
        if(s.config) sensor_config = { ...sensor_config, ...s.config }
        await createSensor(s, sensor_config, `homeassistant/${s.sensor_type || 'sensor'}/solar_inverter_${s.id}/${s.topic}/config`)
      }
      if(s.individual){
        for(let i in INVERTER_CONFIGS) await registerInverter(+i + 1, JSON.parse(JSON.stringify(s)))
      }
    }
    log.info(`Created all ${SENSOR_ID} sensors...`)
    return true
  }catch(e){
    log.error(e)
  }
}
