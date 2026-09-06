import log from '/app/src/logger.js'
import cache from '/app/src/cache/index.js'
import mqtt from '/app/src/mqtt/index.js'
import bridgeApi from '/app/src/helpers/bridge_api.js'

import SYSTEM_CONFIGS from '/app/config/config.json' with { type: 'json' };

const INVERTER_CONFIGS = SYSTEM_CONFIGS?.inverters;

let resetInProgress = new Map()

async function resetBridge(inverter){
    if(!inverter?.inverter_num) return
    let inProgress = resetInProgress.get(inverter.inverter_num), current_state = 'ON'
    if(inProgress){
        let status = await bridgeApi.status(inverter.host)
        if(status){
            current_state = 'OFF'
            resetInProgress.set(inverter.inverter_num, false)
        }else{
           current_state = 'ON' 
        }
    }else{
        await bridgeApi.reboot(inverter.host, inverter.inverter_num)
        resetInProgress.set(inverter.inverter_num, true)
        current_state = 'ON'
    }
    await cache.set(`reset_bridge_${inverter.inverter_num}`, { state: current_state})
    await mqtt.sendSensorValue(`solar_inverter/${inverter.inverter_num}/status/reset_bridge/state`, current_state )
}
export default async function(){
    try{
        for(let i of INVERTER_CONFIGS){
            let data = await cache.get(`reset_bridge_${i.inverter_num}`)
            if(data?.state == 'ON') await resetBridge(i)
        }
        
    }catch(e){
        log.error(e)
    }
}