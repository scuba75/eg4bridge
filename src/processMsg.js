'use strict'
const log = require('./logger')
const cache = require('./sqlite')
const sensors = require('./sensorConfig/schedule.json')
const schedule = require('./schedule')

module.exports = (topic, msg)=>{
  if(!sensors[topic]) return
  if(!cache.status()) return
  let data = { raw: schedule.encode(msg), decodedValue: msg, register: sensors[topic].register }
  cache.set(topic, data)
  log.info(`Set desired value for ${topic} to ${msg} (${data.raw})`)
}
