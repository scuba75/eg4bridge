import log from '/app/src/logger.js'
import { dataList } from '/app/src/data_list.js';
import cache from './cache.js'
import checkTime from './check_time.js'

import updateSchedule from '/app/src/update_schedule/index.js'

export default async function(){
  let daily_update_time = dataList?.schedule?.daily_update_time
  if(!daily_update_time) return

  let runTask = checkTime('daily_update_time', daily_update_time, 10, true)
  if(runTask){
    await updateSchedule.all()
    cache.set('daily_update_time', true)
  }
}
