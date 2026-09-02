import log from '/app/src/logger.js'
import cache from '/app/src/cache/index.js'
import mqtt from '/app/src/mqtt/index.js'
import checkSummer from '/app/src/helpers/check_summer.js'

import { dataList } from '/app/src/data_list.js';


export default async function(){
  let common_key = 'winter'
  if(checkSummer()) common_key = 'summer'
  let peak_start_key = `peak_start_${common_key}`, peak_end_key = `peak_end_${common_key}`

  if(!dataList.schedule[peak_start_key] || !dataList.schedule[peak_end_key]) return

  dataList.schedule.peak_start = dataList.schedule[peak_start_key], dataList.schedule.peak_end = dataList.schedule[peak_end_key]

  log.info(`Set peak_start to ${dataList.schedule.peak_start}`);
  log.info(`Set peak_end to ${dataList.schedule.peak_end}`);
}
