'use strict'
const log = require('./logger')
const cache = require('./sqlite')
const mqtt = require('./mqtt')

function getPreviousDate() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .formatToParts(new Date(Date.now() - (24 * 60 * 60 * 1000)))
      .map(p => [p.type, p.value])
  );
  let s_part = (parts.second < 30) ? "00":"30"
  return `${parts.year}-${parts.month}-${parts.day}`
}

module.exports = async(sensor_id, sensor_topic)=>{
  try{
    if(!sensor_id || !sensor_topic) return
    let key = getPreviousDate()
    if(!key) return

    let data = await cache.get(key, 'daily')
    if(!data?.main) return

    let value = data.main[sensor_id]
    if(!value && value != 0) return;

    mqtt.publish(`solar_inverter/main/${sensor_topic?.replace('_daily', '_yesterday')}/state`, value?.toString())

  }catch(e){
    log.error(e)
  }
}
