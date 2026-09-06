import log from '/app/src/logger.js'
import { dataList } from '/app/src/data_list.js';
import checkTime from './check_time.js'
import bridgeApi from '/app/src/helpers/bridge_api.js'

import SYSTEM_CONFIGS from '/app/config/config.json' with { type: 'json' };

const INVERTER_CONFIGS = SYSTEM_CONFIGS?.inverters;

export default async function(){
    try{
        if(dataList?.schedule?.daily_bridge_reset != 'ON') return
        let daily_update_time = dataList?.schedule?.daily_update_time
        if(!daily_update_time) return

        for(let i of INVERTER_CONFIGS){
            if(!i.inverter_num) continue
            let start_window = i.inverter_num * 10, end_window = (i.inverter_num * 10) + 5
            let runTask = checkTime(`daily_inverter_reset_${i.inverter_num}`, daily_update_time, start_window, end_window)
            if(runTask) await bridgeApi.reboot(i.host, i.inverter_num)
        }
    }catch(e){
        log.error(e)
    }
}