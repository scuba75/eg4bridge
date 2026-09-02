import log from '/app/src/logger.js'
import cache from './cache.js'

import dailyUpdate from './daily_update.js'
import disableExtendedSummer from './disable_extended_summer.js'

async function sync(){
  try{
    if(!cache.status()) return setTimeout(sync, 5000)
    await dailyUpdate()
    await disableExtendedSummer()
    setTimeout(sync, 30 * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5000)
  }
}
export default { start: sync }
