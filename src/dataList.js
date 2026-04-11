let dataList = { "1": { "serial": process.env.INVERTER1_SN }, "2": { "serial": process.env.INVERTER2_SN } }
const log = require('./logger')
const cache = require('./sqlite')

const SYNC_INTERVAL = (process.env.SYNC_INTERVAL_SECONDS || 20)

function zonedTimestamp(timeZone = "America/New_York") {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date())
      .map(p => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}
const saveData = async()=>{
  try{
    let data = JSON.parse(JSON.stringify(dataList)), key = zonedTimestamp()
    if(!data?.main || !key?.date || !key?.time) return

    let payload = {...key, ...data}
    await cache.set(key.date, payload, 'daily')
    await cache.set(`${key.date}_${key.time}`, payload, 'minute')
  }catch(e){
    log.error(e)
  }
}
const sync = async()=>{
  try{
    await saveData()
    setTimeout(sync, SYNC_INTERVAL * 1000)
  }catch(e){
    setTimeout(sync, 5000)
    log.error(e)
  }
}
sync()
module.exports = { dataList }
