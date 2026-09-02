import log from '/app/src/logger.js'
import createSensor from './create_sensor.js'
import energy_sensors from '/app/src/sensor_configs/energy.js'

let sensor_device = {
  name: `Solar Inverter Energy`,
  via_device: `solar_inverter_main`,
  identifiers: [`solar_inverter_energy`]
}
async function registerInverter(inv_num, info){
  if(!inv_num || !info) return
  let sensor_config = {
    state_topic: `solar_inverter/${inv_num}/energy/${info.topic}/state`,
    unique_id: `energy_${inv_num}_${info.topic}`,
    name: info.name,
    device: {
      identifiers: [`solar_inverter_${inv_num}`],
      name: `Solar Inverter ${inv_num}`,
      via_device: 'solar_inverter_main'
    }
  }
  if(info.command) sensor_config.command_topic = `solar_inverter/set/energy_cmd/${info.topic}`
  if(info.config) sensor_config = { ...sensor_config, ...info.config }
  info.retain = true
  await createSensor(info, sensor_config, `homeassistant/${info.sensor_type || 'sensor'}/solar_inverter_energy_${inv_num}/${info.topic}/config`)
}
export default async function(INVERTER_CONFIGS = []){
  try{
    if(!INVERTER_CONFIGS || INVERTER_CONFIGS?.length == 0) return
    let array = Object.values(energy_sensors)
    for(let t of array){
      let y = JSON.parse(JSON.stringify(t))
      y.topic = y.topic.replace('_daily', '_yesterday')
      y.name = y.name.replace('(Daily)', '(Yesterday)')
      let today_config = {
        name: t.name,
        state_topic: `solar_inverter/energy/${t.topic}/state`,
        unique_id: `energy_${t.topic}`,
        device: JSON.parse(JSON.stringify(sensor_device))
      }
      if(t.command) today_config.command_topic = `solar_inverter/set/energy_cmd/${t.topic}`
      if(t.config) today_config = { ...today_config, ...t.config }
      t.retain = true
      let yesterday_config = {
        name: y.name,
        state_topic: `solar_inverter/energy/${y.topic}/state`,
        unique_id: `solar_inverter_energy_${y.topic}`,
        device: JSON.parse(JSON.stringify(sensor_device))
      }
      if(y.command) yesterday_config.command_topic = `solar_inverter/set/energy_cmd/${y.topic}`
      if(y.config) yesterday_config = { ...yesterday_config, ...y.config }
      y.retain = true
      if(t.main) await createSensor(t, today_config, `homeassistant/${t.sensor_type || 'sensor'}/solar_inverter_energy/${t.topic}/config`)
      if(y.main) await createSensor(y, yesterday_config, `homeassistant/${y.sensor_type || 'sensor'}/solar_inverter_energy/${y.topic}/config`)
      if(t.individual){
        for(let i in INVERTER_CONFIGS) await registerInverter(+i + 1, JSON.parse(JSON.stringify(t)))
      }
    }
    log.info(`Created all energy sensors...`)
    return true
  }catch(e){
    log.error(e)
  }
}
