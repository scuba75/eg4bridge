import log from '/app/src/logger.js'
import mqtt from '/app/src/mqtt/index.js'
import cache from '/app/src/cache/index.js'
import { decodeValue } from '/app/src/helpers/register_time.js'
import { dataList } from '/app/src/data_list.js';
import all_sensors from '/app/src/sensor_configs/index.js'

export default async function(d, inverter_num, queueWrite){
  try{
    if (!d?.data?.schedule) return;
    for (let i in d.data.schedule) {
      if (!i || !d?.data?.schedule || !d?.data?.schedule[i] || !d.data.schedule[i]?.raw) continue;
      let sensor = all_sensors[i]
      if(!sensor) continue;

      let decodedValue = decodeValue(d.data.schedule[i].raw);
      if (!decodedValue) continue;

      if (!dataList.schedule) dataList.schedule = {};
      dataList.schedule[i] = decodedValue;


      if(sensor.topic && sensor.id) await mqtt.sendSensorValue(`solar_inverter/${sensor.id}/${sensor.topic}/state`, decodedValue);

      let desired = await cache.get(i);
      if (!desired?.raw) {
        await cache.set(i, { raw: d.data.schedule[i].raw, decodedValue: decodedValue, register: d.data.schedule[i].register });
        desired = cache.get(i);
      }
      if (desired?.decodedValue && sensor.topic && sensor.id) {
        let desired_topic = `${sensor.topic}_desired`;
        if (!dataList.schedule) dataList.schedule = {};
        dataList.schedule[desired_topic] = desired?.decodedValue;
        await mqtt.sendSensorValue(`solar_inverter/${sensor.id}/${desired_topic}/state`, desired?.decodedValue);
      }

      if (desired?.raw != d.data.schedule[i].raw && d.data.schedule[i].register > 0 && desired?.raw >= 0){
        //console.log(desired)
        //console.log(d.data.schedule[i])
        queueWrite(inverter_num, d.data.schedule[i].register, desired.raw)
      };
    }
  }catch(e){
    log.error(e)
  }
}
