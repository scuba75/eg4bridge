import mqtt from '/app/src/mqtt/index.js';
import { dataList } from '/app/src/data_list.js';
import previousDay from '../previous_day.js';

export default async function(influxWrite, timeNow){
  let pv_power_1 = +(dataList.inverters['1']?.pv_power_dc || 0) + +(dataList.inverters['1']?.ac_couple_pwr || 0), pv_power_2 = +(dataList.inverters['2']?.pv_power_dc || 0) + +(dataList.inverters['2']?.ac_couple_pwr || 0);
  let pv_power = +(pv_power_1 || 0) + +(pv_power_2 || 0);
  dataList.inverters['1'].pv_power = pv_power_1;
  dataList.inverters['2'].pv_power = pv_power_2;
  dataList.main.pv_power = pv_power;
  influxWrite('pv_power', '1', pv_power_1, 'W', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/1/pv/pv_power/state`, pv_power_1);
  influxWrite('pv_power', '2', pv_power_2, 'W', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/2/pv/pv_power/state`, pv_power_2);
  influxWrite('pv_power', 'main', pv_power, 'W', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/pv/pv_power/state`, pv_power);

  let pv_energy_daily_1 = (dataList.inverters['1']?.pv_energy_dc_daily || 0) + (dataList.inverters['1']?.pv_energy_ac_daily || 0), pv_energy_daily_2 = (dataList.inverters['2']?.pv_energy_dc_daily || 0) + (dataList.inverters['2']?.pv_energy_ac_daily || 0);
  let pv_energy_daily = (pv_energy_daily_1 || 0) + (pv_energy_daily_2 || 0);
  dataList.inverters['1'].pv_energy_daily = pv_energy_daily_1 || 0;
  dataList.inverters['2'].pv_energy_daily = pv_energy_daily_2 || 0;
  dataList.main.pv_energy_daily = pv_energy_daily;
  influxWrite('pv_energy_daily', '1', pv_energy_daily_1, 'kWh', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/1/energy/pv_energy_daily/state`, pv_energy_daily_1);
  influxWrite('pv_energy_daily', '2', pv_energy_daily_2, 'kWh', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/2/energy/pv_energy_daily/state`, pv_energy_daily_2);
  influxWrite('pv_energy_daily', 'main', pv_energy_daily, 'kWh', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/energy/pv_energy_daily/state`, pv_energy_daily);
  await previousDay('pv_energy_daily', 'pv_energy_daily', 'energy');
}
