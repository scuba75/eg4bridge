import log from '/app/src/logger.js';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import mqtt from '/app/src/mqtt/index.js';
import { dataList } from '/app/src/data_list.js';

import mainInverters from './main/index.js'
import calculatedSensors from './calculated/index.js'
import manualSensors from './manual_sensors/index.js'
import microInverters from './micro_inverters.js'

const INFLUX_TOKEN = process.env.INFLUX_TOKEN, INFLUX_URL = process.env.INFLUX_URL, INFLUX_ORG = process.env.INFLUX_ORG, INFLUX_BUCKET = process.env.INFLUX_BUCKET;
let influxClient, influxWriteClient;
const influxInit = () => {
  try {
    if (INFLUX_TOKEN, INFLUX_URL, INFLUX_ORG, INFLUX_BUCKET) {
      influxClient = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
      influxWriteClient = influxClient.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ms');
      log.info(`Created influxdb client...`);
      return;
    }
    log.info(`no connection info for influxdb client. Skipping...`);
    return;
  } catch (e) {
    setTimeout(influxInit, 5000);
    log.error(e);
  }
};
const checkNumber = (value) => {
  return !Number.isNaN(Number(value));
};
influxInit();
const influxWrite = (id, device, value, unit_of_measurement, timeNow) => {
  try {
    if (!influxClient || !influxWriteClient || !timeNow || !id || !device) return;
    let influxMeasurement = unit_of_measurement || 'status';

    let data_point = new Point(influxMeasurement).tag('device', device).tag('id', id);
    if (influxMeasurement == 'status') {
      data_point.stringField('value', value);
    } else {
      data_point.floatField('value', value);
    }
    data_point.timestamp(timeNow);
    influxWriteClient.writePoint(data_point);
  } catch (e) {
    log.error(e);
  }
};
export default async function(inv_num, data){
  try{
    let timeNow = Date.now();
    await mainInverters(inv_num, data, influxWrite, timeNow)
    await calculatedSensors(influxWrite, timeNow)
    await manualSensors();
    if (data?.get_open_dtu_values) await microInverters(inv_num, influxWrite, timeNow);
    influxWriteClient.flush();
    dataList.main.updated = Math.round(timeNow / 1000);
    dataList.updated = timeNow;
    if (dataList?.main?.updated) mqtt.sendSensorValue('solar_inverter/status/updated/state', dataList.main.updated);
  }catch(e){
    log.error(e)
  }
}
