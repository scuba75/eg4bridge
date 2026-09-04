import log from '/app/src/logger.js'
import cache from './cache.js'
const TIME_ZONE = process.env.TIME_ZONE || 'America/New_York'

import { checkTimeBetween } from '/app/src/helpers/time.js'

export default function( key, hour_minute, time_window_start, time_window_end){

  let isTime = checkTimeBetween(hour_minute, hour_minute, time_window_start, time_window_end), hasRun = cache.get(key)

  if(isTime && !hasRun) return true
  if(!isTime && hasRun){
    log.info(`reseting ${key} flag...`)
    return cache.set(key, false)
  }
}
