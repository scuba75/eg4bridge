import log from '/app/src/logger.js'
import { dataList } from '/app/src/data_list.js';
import cache from './cache.js'
import checkTime from './check_time.js'

import { checkTimeBetween } from '/app/src/helpers/time.js'
import extendedSolar from '/app/src/helpers/extended_solar.js'

export default async function(){
  let grid_first_end = dataList.schedule?.grid_first_end
  if(!grid_first_end) return
  let runTask = checkTime('grid_first_end', grid_first_end, 30, -25)
  if(runTask){
    //log.info(`Disabling extended solar if battery is less than 95%. Current battery SOC: ${dataList?.main?.battery_soc || 0}%, Extended Solar is ${dataList?.schedule?.enable_extended_solar}`)
    if(dataList?.schedule?.summer_peak_hours != 'ON') return
    if(dataList?.schedule?.enable_extended_solar != 'ON') return
    if((dataList?.main?.battery_soc || 0) >= 95) return
    log.info(`Disabling extended solar. Current battery SOC: ${dataList?.main?.battery_soc || 0}%`)
    await extendedSolar.disable()
    cache.set('grid_first_end', true)
  }
}
