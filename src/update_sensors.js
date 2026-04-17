'use strict'
const log = require('./logger')
const { InfluxDB, Point } = require('@influxdata/influxdb-client')
const { dataList } = require('./data_list')
const mqtt = require('./mqtt')
const previousDay = require('./previous_day')
const calculatedSensors = require('./calculated_sensors')
const SENSOR_CONFIGS = require('./sensor_configs')

const INVERTER_CONFIGS = require('/app/data/config.json')?.inverters
const INFLUX_TOKEN = process.env.INFLUX_TOKEN, INFLUX_URL = process.env.INFLUX_URL, INFLUX_ORG = process.env.INFLUX_ORG, INFLUX_BUCKET = process.env.INFLUX_BUCKET

let MASTER_INVERTER = 1

let influxClient, influxWriteClient
const influxInit = ()=>{
  try{
    if(INFLUX_TOKEN, INFLUX_URL, INFLUX_ORG, INFLUX_BUCKET){
      influxClient = new InfluxDB({url: INFLUX_URL, token: INFLUX_TOKEN})
      influxWriteClient = influxClient.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ms')
      log.info(`Created influxdb client...`)
      return
    }
    log.info(`no connection info for influxdb client. Skipping...`)
    return
  }catch(e){
    setTimeout(influxInit, 5000)
    log.error(e)
  }
}
const checkNumber =(value)=>{
  return !Number.isNaN(Number(value))
}
influxInit()
const influxWrite = (id, device, value, unit_of_measurement, timeNow) =>{
  try{
    if(!influxClient || !influxWriteClient || !timeNow || !id || !device) return
    let influxMeasurement = unit_of_measurement || 'status'

    let data_point = new Point(influxMeasurement).tag('device', device).tag('id', id)
    if(influxMeasurement == 'status'){
      data_point.stringField('value', value)
    }else{
      data_point.floatField('value', value)
    }
    data_point.timestamp(timeNow)
    influxWriteClient.writePoint(data_point)
  }catch(e){
    log.error(e)
  }
}
const roundValue = (value, decimal_places)=>{
  return parseFloat((value || 0)?.toFixed(decimal_places || 2))
}
module.exports = async(inverter_num, data) =>{
  try{
    if(!inverter_num || !data || !dataList?.inverters[inverter_num]) return;

    let timeNow = Date.now()

    if(data?.master_slave == 1) MASTER_INVERTER = inverter_num
    if(!dataList.main) dataList.main = {}

    for(let i in data){
      if(!i || (!data[i] && +(data[i] != 0))) continue;
      dataList.inverters[inverter_num][i] = data[i]


      let sensor = SENSOR_CONFIGS[i]
      if(!sensor) continue;

      let main_topic = sensor.topic
      if(!main_topic) continue;

      if(sensor?.main){
        let main_state_topic = `solar_inverter/main/${main_topic}/state`
        if(sensor.main == "master" && inverter_num == MASTER_INVERTER){
          let value = data[i]
          if(i == 'master_slave') value = inverter_num
          dataList.main[i] = value
          mqtt.sendSensorValue(main_state_topic, value)
        }
        if(sensor.main == "both"){
          let value = parseFloat(data[i] || 0)
          for(let d in INVERTER_CONFIGS){
            let next_inverter = +(+d + 1)
            if(next_inverter == inverter_num) continue;

            if(dataList.inverters[next_inverter]) value += parseFloat(dataList.inverters[next_inverter][i] || 0)
          }
          if(value) value = roundValue(value)
          dataList.main[i] = value
          mqtt.sendSensorValue(main_state_topic, value)
        }
        if(sensor.main == "average"){
          let value = parseFloat(data[i] || 0), count = 1
          for(let d in INVERTER_CONFIGS){
            let next_inverter = +(+d + 1)
            if(next_inverter == inverter_num) continue;

            if(dataList.inverters[next_inverter]){
              value += parseFloat(dataList.inverters[next_inverter][i] || 0)
              count++
            }
          }
          if(value) value = roundValue((value / count), 1)
          dataList.main[i] = value
          mqtt.sendSensorValue(main_state_topic, value)
        }
        if(sensor.main == inverter_num){
          dataList.main[i] = data[i]
          mqtt.sendSensorValue(main_state_topic, data[i])
        }
        if(i?.endsWith('_daily')) previousDay(i, main_topic)
        if(dataList.main[i] || dataList.main[i] == 0) influxWrite(i, 'main', dataList.main[i], sensor?.config?.unit_of_measurement || sensor?.unit_of_measurement, timeNow)
      }

      if(sensor?.individual){
        let state_topic = `solar_inverter/${inverter_num}/${main_topic}/state`
        mqtt.sendSensorValue(state_topic, data[i])
        influxWrite(i, `inverter_${inverter_num}`, data[i], sensor?.config?.unit_of_measurement || sensor?.unit_of_measurement, timeNow)
      }
    }
    await calculatedSensors(influxWrite, timeNow)
    influxWriteClient.flush()
    dataList.main.updated = Math.round(timeNow / 1000)
    dataList.updated = timeNow
    if(dataList?.main?.updated) mqtt.sendSensorValue('solar_inverter/main/updated/state', dataList.main.updated)
  }catch(e){
    log.error(e)
  }
}
