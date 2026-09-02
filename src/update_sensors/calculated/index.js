import log from '/app/src/logger.js'
import battery from './battery.js'
import pv from './pv.js'
import load from './load.js'

export default async function(influxWrite, timeNow){
  try{
    await battery(influxWrite, timeNow)
    await pv(influxWrite, timeNow)
    await load(influxWrite, timeNow)
  }catch(e){
    log.error(e)
  }
}
