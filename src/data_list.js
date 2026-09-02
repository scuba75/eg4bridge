import log from '/app/src/logger.js';
import cache from '/app/src/cache/index.js';

let dataList = { inverters: {}, main: {}, schedule: {}, micro_inverters: {} }, datalist_ready;

const SYNC_INTERVAL = (process.env.SYNC_INTERVAL_SECONDS || 20);

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
  let s_part = (parts.second < 30) ? "00" : "30";
  let h_part = (parts.hour < 24) ? parts.hour : "00";
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${h_part}:${parts.minute}:${s_part}`, month: parts.month, day: parts.day, year: parts.year };
}
async function restoreData(){
  try{
    if(!cache.status()) return setTimeout(restoreData, 5000)
    datalist_ready = true
    return true
    let key = zonedTimestamp(Date.now())
    let data = await cache.get(key.date, 'daily')
    if(data) dataList = data
    datalist_ready = true
    log.info(`Restored dataList states...`)
    return true
  }catch(e){
    log.error(e)
  }
}
async function saveData(){
  try {
    let data = JSON.parse(JSON.stringify(dataList));
    if (!data?.updated) return;

    let key = zonedTimestamp(data.updated);
    if (!key?.date || !key?.time) return;

    let payload = { ...key, ...data };
    await cache.set(key.date, payload, 'daily');
  } catch (e) {
    log.error(e);
  }
};
async function sync(){
  try {
    await saveData();
    setTimeout(sync, SYNC_INTERVAL * 1000);
  } catch (e) {
    setTimeout(sync, 5000);
    log.error(e);
  }
};

function dataListStatus(){
  return datalist_ready
}
async function init(){
  try{
    let status = await restoreData()
    if(status) return sync()
    setTimeout(init, 5000)
  }catch(e){
    log.error(e)
    setTimeout(init, 5000)
  }
}
queueMicrotask(init)
export { dataList, dataListStatus };
