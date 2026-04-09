'use strict'
const log = require('./logger')
const { dataList } = require('./dataList')
const mqtt = require('./mqtt')
const sensorConfig = require('./sensorConfig.json')

module.exports = (inverterNum, otherInverter, MASTER_INVERTER, data) =>{
  try{
    if(!inverterNum || !data || !MASTER_INVERTER) return;

    for(let i in data){
      if(!i || (!data[i] && +(data[i] != 0))) continue;

      let sensor = sensorConfig[i]
      if(!sensor) continue;

      let main_topic = sensor.topic
      if(!main_topic) continue;



      if(sensor?.inverter){
        let main_state_topic = `solar_inverter/main/${main_topic}/state`
        if(sensor.inverter == "master" && inverterNum == MASTER_INVERTER){
          let value = data[i]?.toString()
          if(i == 'master_slave') value = inverterNum?.toString()
          if(!dataList.main) dataList.main = {}
          dataList.main[i] = value
          mqtt.publish(main_state_topic, value)
        }
        if(sensor.inverter == "both"){
          let value = parseFloat(data[i] || 0)
          if(dataList[otherInverter]) value += parseFloat(dataList[otherInverter][i] || 0)
          if(!dataList.main) dataList.main = {}
          dataList.main[i] = value
          mqtt.publish(main_state_topic, value?.toString())
        }
        if(sensor.inverter == "average"){
          let value = parseFloat(data[i] || 0), alt_value = 0
          if(dataList[otherInverter]) alt_value += parseFloat(dataList[otherInverter][i] || 0)
          if(alt_value) value = (value + alt_value) / 2

          if(!dataList.main) dataList.main = {}
          dataList.main[i] = value
          mqtt.publish(main_state_topic, value?.toString())
        }
      }

      if(sensor?.individual){
        let state_topic = `solar_inverter/inverter${inverterNum}/${main_topic}/state`
        mqtt.publish(state_topic, data[i]?.toString())
      }
      if(sensor?.calcuate?.id){
        let calc_sensor = sensorConfig[sensor.calcuate.id]
        if(!calc_sensor) continue;

        let calc_value = 0, sensor_value = parseFloat(data[i] ||0), real_value = 0, calc_topic = calc_sensor.topic
        if(!calc_topic) continue;

        if(dataList[inverterNum]) calc_value += parseFloat(dataList[inverterNum][sensor.calcuate.dependent] || 0)

        if(sensor.calcuate.operator == '/' && sensor_value != 0){
          real_value = calc_value / sensor_value
        }
        if(sensor.calcuate.operator == '*'){
          real_value = sensor_value * calc_value
        }
        if(sensor.calcuate.operator == '+'){
          real_value = sensor_value + calc_value
        }
        if(sensor.calcuate.operator == '-'){
          real_value = calc_value - sensor_value
        }
        if(!dataList[inverterNum]) dataList[inverterNum] = {}
        dataList[inverterNum][sensor.calcuate.id] = real_value
        mqtt.publish(`solar_inverter/inverter${inverterNum}/${calc_topic}/state`, real_value?.toString())

        if(calc_sensor.inverter == 'both'){
          let main_value = real_value
          if(dataList[otherInverter]) main_value += parseFloat(dataList[otherInverter][sensor.calcuate.id] || 0)

          if(!dataList.main) dataList.main = {}
          dataList.main[sensor.calcuate.id] = main_value
          mqtt.publish(`solar_inverter/main/${calc_topic}/state`, main_value?.toString())
        }
      }



    }
    mqtt.publish('solar_inverter/updated/state', (Date.now())?.toString())
  }catch(e){
    log.error(e)
  }
}
