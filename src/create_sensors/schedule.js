import log from '/app/src/logger.js'
import createSensor from './create_sensor.js'
import schedule_sensors from '/app/src/sensor_configs/schedule.js'

let sensor_device = {
  name: `Solar Inverter Schedule`,
  via_device: `solar_inverter_main`,
  identifiers: [`solar_inverter_schedule`]
}

export default async function(){
  try{
    let array = Object.values(schedule_sensors)
    for(let i of array){
      let sensor_config = {
        name: i.name,
        state_topic: `solar_inverter/schedule/${i.topic}/state`,
        unique_id: `schedule_${i.topic}`,
        device: JSON.parse(JSON.stringify(sensor_device))
      }
      if(i.command && i.sensor_type) sensor_config.command_topic = `solar_inverter/set/${i.sensor_type}_cmd/${i.topic}`
      if(i.config) sensor_config = { ...sensor_config, ...i.config }
      if(i.json_attributes?.length > 0) sensor_config.json_attributes_topic = `solar_inverter/schedule/${i.topic}_attribute/state`
      await createSensor(i, sensor_config, `homeassistant/${i.sensor_type || 'sensor'}/solar_inverter_schedule/${i.topic}/config`)
    }
    log.info(`Created all schedule sensors...`)
    return true
  }catch(e){
    log.error(e)
  }
}
