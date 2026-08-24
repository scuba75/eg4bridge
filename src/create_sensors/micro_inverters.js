import log from '/app/src/logger.js';
import { dataList } from '/app/src/data_list.js';
import mqtt from '/app/src/mqtt/index.js';

let MICRO_INVERTER_SN = [], OPENDTU_HOST = process.env.OPENDTU_HOST, OPENDTU_AUTH = process.env.OPENDTU_AUTH;
if (process.env.MICRO_INVERTER_SN) MICRO_INVERTER_SN = JSON.parse(process.env.MICRO_INVERTER_SN);

const STRING_COUNT = +(process.env.STRING_COUNT || 4);

let main_topics = [
  { name: `Energy (Daily)`, state_topic: `pv_energy_daily`, state_class: 'total', unit_of_measurement: 'kWh', device_class: 'energy' },
  { name: `Energy (Total)`, state_topic: `pv_energy_total`, state_class: 'total', unit_of_measurement: 'kWh', device_class: 'energy' },
  { name: `Power`, state_topic: `pv_power_ac`, state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' },
  { name: `Power 1`, state_topic: `pv_power_ac_1`, state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' },
  { name: `Power 2`, state_topic: `pv_power_ac_2`, state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' },
  { name: `IP Address`, state_topic: `ip_address`, icon: 'mdi:ip-network' }
];
let inv_topics = [
  { name: `Energy (AC)`, state_topic: `pv_energy_ac`, state_class: 'total', unit_of_measurement: 'kWh', device_class: 'energy' },
  { name: `Power (AC)`, state_topic: `pv_power_ac`, state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' },
  { name: `Voltage (AC)`, state_topic: `pv_voltage_ac`, state_class: 'measurement', unit_of_measurement: 'V', device_class: 'voltage' },
  { name: `Current (AC)`, state_topic: `pv_current_ac`, state_class: 'measurement', unit_of_measurement: 'A', device_class: 'current' },
  { name: `Temperature`, state_topic: `pv_inverter_temperature_ac`, state_class: 'measurement', unit_of_measurement: '°C', device_class: 'temperature' },
  { name: `Serial`, state_topic: `pv_inverter_serial_number` }
];
let string_topics = [
  { name: `Energy {{NUM}} (DC)`, state_topic: `pv_energy_dc`, state_class: 'total', unit_of_measurement: 'kWh', device_class: 'energy' },
  { name: `Power {{NUM}} (DC)`, state_topic: `pv_power_dc`, state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' },
  { name: `Voltage {{NUM}} (DC)`, state_topic: `pv_voltage_dc`, state_class: 'measurement', unit_of_measurement: 'V', device_class: 'voltage' },
  { name: `Current {{NUM}} (DC)`, state_topic: `pv_current_dc`, state_class: 'measurement', unit_of_measurement: 'A', device_class: 'current' },
];

export default async () => {
  try {
    if (!MICRO_INVERTER_SN || MICRO_INVERTER_SN?.length == 0) return;
    let main_device = { device: { name: `Open DTU`, identifiers: [`solar_micro_inverter_main`] } };
    for (let i in main_topics) {
      let config = JSON.parse(JSON.stringify(main_topics[i]));
      let register_topic = `homeassistant/sensor/micro_inverter_${config.state_topic}/config`;
      config.unique_id = `micro_inverter_main_${config.state_topic}`;
      config.state_topic = `micro_inverter/main/${config.state_topic}/state`;
      await mqtt.registerSensor(register_topic, { ...config, ...main_device });
    }
    for (let i in MICRO_INVERTER_SN) {
      let inverter_num = +i + 1;
      let inv_device = { device: { name: `HM-1200NT-${inverter_num}`, identifiers: [`micro_inverter_${inverter_num}`], via_device: `solar_micro_inverter_main` } };
      for (let t in inv_topics) {
        let config = JSON.parse(JSON.stringify(inv_topics[t]));
        let register_topic = `homeassistant/sensor/micro_inverter_${inverter_num}_${config.state_topic}/config`;
        config.unique_id = `micro_inverter_${inverter_num}_${config.state_topic}`;
        config.state_topic = `micro_inverter/${inverter_num}/${config.state_topic}/state`;
        await mqtt.registerSensor(register_topic, { ...config, ...inv_device });
      }
      for (let s = 0; s < STRING_COUNT; s++) {
        for (let x in string_topics) {
          let config = JSON.parse(JSON.stringify(string_topics[x]));
          let register_topic = `homeassistant/sensor/micro_inverter_${inverter_num}_${config.state_topic}_${s}/config`;
          config.unique_id = `micro_inverter_${inverter_num}_${config.state_topic}_${s}`;
          config.name = config.name.replace('{{NUM}}', s);
          config.state_topic = `micro_inverter/${inverter_num}/${config.state_topic}_${s}/state`;
          await mqtt.registerSensor(register_topic, { ...config, ...inv_device });
        }
      }
    }
    log.info(`Created all Micro Inverter Sensors...`);
    return true;
  } catch (e) {
    log.error(e);
  }
};
