import mqtt from '/app/src/mqtt/index.js';
import cache from '/app/src/cache/index.js'
import { dataList } from '/app/src/data_list.js';

import gridFirst from './grid_first.js'
import gridCharge from './grid_charge.js'
import peak from './peak.js'


async function all(){
  await gridFirst()
  await gridCharge()
  await peak()
  cache.set('update_solar_schedule', { state: 'OFF' })
  dataList.schedule.update_solar_schedule = 'OFF'
  await mqtt.sendSensorValue(`solar_inverter/schedule/update_solar_schedule/state`, 'OFF')
}
export default { all, gridFirst, gridCharge, peak }
