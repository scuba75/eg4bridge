let dataList = { inverters:{}, main: {}, schedule: {} }
const log = require('./logger')

const cache = require('./sqlite')

const SYNC_INTERVAL = (process.env.SYNC_INTERVAL_SECONDS || 20)

function zonedTimestamp(timeStamp, timeZone = "America/New_York") {
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
      .formatToParts(new Date(timeStamp || Date.now()))
      .map(p => [p.type, p.value])
  );
  let s_part = (parts.second < 30) ? "00":"30"
  let h_part = (parts.hour < 24) ? parts.hour:"00"
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${h_part}:${parts.minute}:${s_part}`, month: parts.month, day: parts.day,  year: parts.year }
}
const saveData = async()=>{
  try{
    let data = JSON.parse(JSON.stringify(dataList))
    if(!data?.updated) return

    let key = zonedTimestamp(data.updated)
    if(!key?.date || !key?.time) return

    let payload = {...key, ...data}
    await cache.set(key.date, payload, 'daily')
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
