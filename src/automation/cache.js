import log from '/app/src/logger.js'
import cache from '/app/src/cache/index.js'
import { dataList } from '/app/src/data_list.js'

let data_cache = {}, CACHE_STATUS

async function init(){
  try{
    if(!cache?.status()) return setTimeout(init, 5000)
    let data = await cache.get('automation')
    if(data) data_cache = data
    CACHE_STATUS = true
    log.info(`automation dataList restored...`)
  }catch(e){
    log.error(e)
    setTimeout(init, 5000)
  }
}
init()

function get(key){
  try{
    if(!key) return
    return data_cache[key]
  }catch(e){
    log.error(e)
  }
}
function set(key, value){
  try{
    if(!key) return
    data_cache[key] = value
    cache.set('automation', data_cache)
  }catch(e){
    log.error(e)
  }
}
function status(){
  return CACHE_STATUS
}
export default { get, set, status }
