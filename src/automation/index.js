import log from '/app/src/logger.js'
import cache from './cache.js'

import dailyBridgeReset from './daily_bridge_reset.js'
import dailyUpdate from './daily_update.js'
import disableExtendedSummer from './disable_extended_summer.js'
import resetBridge from './reset_bridge.js'

async function sync(){
  try{
    if(!cache.status()) return setTimeout(sync, 5000)
    await dailyBridgeReset()
    await dailyUpdate()
    await disableExtendedSummer()
    await resetBridge();
    setTimeout(sync, 10 * 1000)
  }catch(e){
    log.error(e)
    setTimeout(sync, 5000)
  }
}
export default { start: sync }
