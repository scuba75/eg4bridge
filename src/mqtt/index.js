import mqtt from 'mqtt';
import log from '/app/src/logger.js';
import processMsg from './process_msg.js';

let connectMsg = false, MQTT_STATUS = false, client;
const MQTT_HOST = process.env.MQTT_HOST;
const MQTT_PORT = process.env.MQTT_PORT || '1883';
const MQTT_USER = process.env.MQTT_USER || 'hassio';
const MQTT_PASS = process.env.MQTT_PASS || 'hassio';
const DEVICE_NAME = process.env.DEVICE_NAME || 'solar_inverter';

if (MQTT_HOST) {
  const connectUrl = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;
  log.info(`MQTT Connect URL: ${connectUrl}`);

  client = mqtt.connect(connectUrl, {
    clientId: `mqtt_${DEVICE_NAME}`,
    clean: true,
    keepalive: 60,
    connectTimeout: 4000,
    username: MQTT_USER,
    password: MQTT_PASS,
    reconnectPeriod: 1000,
  });
  client.on('connect', () => {
    if (!connectMsg) {
      connectMsg = true;
      MQTT_STATUS = true;
      log.info('MQTT Connection successful...');
    }
    client.subscribe('solar_inverter/set/#', (err) => {
      if (err) log.error(err);
    });
  });
  client.on('message', (topic, msg) => {
    processMsg(topic?.split('/')[2], msg?.toString());
  });
}

function status(){
  return MQTT_STATUS;
};
function publish(topic, message, retain = false, expire = false){
  if (!MQTT_STATUS) return;
  return new Promise((resolve, reject) => {
    let opts = { qos: 1, retain: retain };
    if (expire) {
      opts.properties = { messageExpiryInterval: 60 };
    }
    client.publish(topic, message, opts, (error) => {
      if (error) reject(error);
      resolve();
    });
  });
};
function registerSensor(topic, payload){
  if (!MQTT_STATUS) return;
  if (!topic || !payload) return;
  return new Promise((resolve, reject) => {

    client.publish(topic, JSON.stringify(payload), { qos: 1, retain: true }, (error, packet) => {
      if (error) reject(error);
      resolve();
    });
  });
};
function sendSensorValue(topic, value, retain = false){
  if (!MQTT_STATUS || !topic) return;
  return new Promise((resolve, reject) => {
    client.publish(topic, (value || 0)?.toString(), { qos: 1, retain: retain }, (error) => {
      if (error) reject(error);
      resolve();
    });
  });
};


export default { status, publish, registerSensor, sendSensorValue };
