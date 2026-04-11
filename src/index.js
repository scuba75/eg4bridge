'use strict'
const log = require('./logger')
//log.setLevel('debug');
const mqtt = require('./mqtt')
const createSensors = require('./createSensors')
const cache = require('./sqlite')

const inverters = require('./inverters')
require('./express')


const MQTT_HOST = process.env.MQTT_HOST

const checkCache = ()=>{
  try{
    let status = cache.status()
    if(status && MQTT_HOST){
      checkMqtt()
      return
    }
    if(status && !MQTT_HOST){
      log.info(`Skipping MQTT check, MQTT_HOST not provided...`)
      inverters.start()
      return
    }
    setTimeout(checkCache, 5000)
  }catch(e){
    setTimeout(checkCache, 5000)
    log.error(e)
  }
}
const checkMqtt = async()=>{
  try{
    let status = mqtt.status()
    if(status) status = await createSensors()
    if(status){
      inverters.start()
      return
    }
    setTimeout(checkMqtt, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkMqtt, 5000)
  }
}
checkCache()
