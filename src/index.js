'use strict'
const log = require('./logger')
const cache = require('./cache')
const mqtt = require('./mqtt')
require('./inverters')
require('./express')

const checkCache = ()=>{
  try{
    let status = cache.status()
    if(status){
      checkMqtt()
      return
    }
    setTimeout(checkCache, 5000)
  }catch(e){
    setTimeout(checkCache, 5000)
    log.error(e)
  }
}
const checkMqtt = ()=>{
  try{
    let status = mqtt.status()
    if(status) return
    setTimeout(checkMqtt, 5000)
  }catch(e){
    log.error(e)
    setTimeout(checkMqtt, 5000)
  }
}

checkCache()
