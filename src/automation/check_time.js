import log from '/app/src/logger.js'
import cache from './cache.js'
const TIME_ZONE = process.env.TIME_ZONE || 'America/New_York'

function getTimeParts(){
  let time = new Date()
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(time);
}
function isWithin(hour, minute, parts, time_window = 5){
  let tzHour   = Number(parts.find(p => p.type === 'hour').value) % 24;
  let tzMinute = Number(parts.find(p => p.type === 'minute').value);

  let nowMins    = tzHour * 60 + tzMinute;
  let startMins = hour * 60 + minute;
  let endMins   = startMins + time_window;

  return nowMins >= startMins && nowMins < endMins;
}
function isBefore(hour, minute, parts, time_window = 5){
  let tzHour   = Number(parts.find(p => p.type === 'hour').value) % 24;
  let tzMinute = Number(parts.find(p => p.type === 'minute').value);

  let nowMins   = tzHour * 60 + tzMinute;
  let endMins = hour * 60 + minute;
  let startMins  = endMins - time_window;
  return nowMins >= startMins && nowMins < endMins;
}

export default function( key, hour_minute, timeWindow, isAfter = true){
  let array = hour_minute?.split(':')
  if(!array || array?.length < 2) return
  let hour = parseInt(array[0]), minute = parseInt(array[1]), time = new Date();

  let parts = getTimeParts()
  let isTime, hasRun = cache.get(key)
  if(isAfter){
    isTime = isWithin(hour, minute, parts, timeWindow)
  }else{
    isTime = isBefore(hour, minute, parts, timeWindow)
  }
  if(isTime && !hasRun) return true
  if(!isTime && hasRun){
    log.info(`reseting ${key} flag...`)
    return cache.set(key, false)
  }
}
