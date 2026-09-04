import mqtt from '/app/src/mqtt/index.js'
import { dataList } from '/app/src/data_list.js';
import previousDay from '../previous_day.js';

import CONFIGS from '/app/config/config.json' with { type: 'json' };

const INVERTER_CONFIGS = CONFIGS?.inverters;

const roundValue = (value, decimal_places) => {
  return parseFloat((value || 0)?.toFixed(decimal_places || 2));
};
export default async function(inv_num, data, influxWrite, timeNow, sensor_key, sensor, MASTER_INVERTER){
  let state_topic = `solar_inverter/${sensor.id}/${sensor.topic}/state`;
  if (sensor.main == "master" && inv_num == MASTER_INVERTER) {
    let value = data;
    if (sensor_key == 'master_slave') value = inv_num;
    dataList.main[sensor_key] = value;
    mqtt.sendSensorValue(state_topic, value);
  }
  if (sensor.main == "both") {
    let value = parseFloat(data || 0);
    for (let d in INVERTER_CONFIGS) {
      let next_inverter = +(+d + 1);
      if (next_inverter == inv_num) continue;

      if (dataList.inverters[next_inverter]) value += parseFloat(dataList.inverters[next_inverter][sensor_key] || 0);
    }
    if (value) value = roundValue(value);
    dataList.main[sensor_key] = value;
    mqtt.sendSensorValue(state_topic, value);
  }
  if (sensor.main == "average") {
    let value = parseFloat(data || 0), count = 1;
    for (let d in INVERTER_CONFIGS) {
      let next_inverter = +(+d + 1);
      if (next_inverter == inv_num) continue;

      if (dataList.inverters[next_inverter]) {
        value += parseFloat(dataList.inverters[next_inverter][sensor_key] || 0);
        count++;
      }
    }
    if (value) value = roundValue((value / count), 1);
    dataList.main[sensor_key] = value;
    mqtt.sendSensorValue(state_topic, value);
  }
  if (sensor.main == inv_num) {
    dataList.main[sensor_key] = data;
    mqtt.sendSensorValue(state_topic, data);
  }
  if (sensor_key?.endsWith('_daily')) await previousDay(sensor_key, sensor.topic, sensor.id);
  if (dataList.main[sensor_key] || dataList.main[sensor_key] == 0) influxWrite(sensor_key, 'main', dataList.main[sensor_key], sensor?.config?.unit_of_measurement || sensor?.unit_of_measurement, timeNow);
}
