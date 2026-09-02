import log from './logger.js';
import mqtt from './mqtt/index.js';
import createSensors from './create_sensors/index.js';
import cache from './cache/index.js';
import { dataListStatus } from './data_list.js'

import inverters from './inverters.js';
import './express.js';

const MQTT_HOST = process.env.MQTT_HOST;

function checkCache(){
  try {
    let status = cache.status();
    if(status) status = dataListStatus();
    if (status && MQTT_HOST) {
      return checkMqtt();
    }
    if (status && !MQTT_HOST) {
      log.info(`Skipping MQTT check, MQTT_HOST not provided...`);
      return startInverters();
    }
    setTimeout(checkCache, 5000);
  } catch (e) {
    setTimeout(checkCache, 5000);
    log.error(e);
  }
};
async function checkMqtt(){
  try {
    let status = mqtt.status();
    if (status) status = await createSensors();
    if (status) return startInverters();
    setTimeout(checkMqtt, 5000);
  } catch (e) {
    log.error(e);
    setTimeout(checkMqtt, 5000);
  }
};
async function startInverters(){
  try {
    let status = inverters.status();
    if (status) return inverters.start();
    setTimeout(startInverters, 5000);
  } catch (e) {
    setTimeout(startInverters, 5000);
    log.error(e);
  }
};
checkCache();
