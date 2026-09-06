import { dataList } from '/app/src/data_list.js'
import mqtt from '/app/src/mqtt/index.js'

export default async function(){
    let timeNow = (Date.now() - (120 * 1000)), inv_1 = dataList.inverters['1']?.connected, inv_2 = dataList.inverters['2']?.connected, current_state = 'ON'
    if(inv_1 && inv_1  < timeNow) current_state = 'OFF'
    if(inv_2 && inv_2  < timeNow) current_state = 'OFF'
    await mqtt.sendSensorValue('solar_inverter/status/bridge_connected/state', current_state)
}