import mqtt from '/app/src/mqtt/index.js';
import { dataList } from '/app/src/data_list.js';
import previousDay from '../previous_day.js';

const POWER_COST = parseFloat(process.env.POWER_COST || "0.1044288425047438");

function roundValue(value, decimal_places){
  return parseFloat((value || 0)?.toFixed(decimal_places || 2));
};

export default async function(influxWrite, timeNow){
  let pv_energy_daily = dataList.main.pv_energy_daily
  let battery_energy_charge_solar = (dataList.main.battery_energy_charge_solar_daily || 0), load_energy_grid = (dataList.main.load_energy_grid_daily || 0);

  let load_energy_solar_daily = roundValue(pv_energy_daily > battery_energy_charge_solar ? (pv_energy_daily - battery_energy_charge_solar || 0) : 0);
  dataList.main.load_energy_solar_daily = load_energy_solar_daily;
  influxWrite('load_energy_solar_daily', 'main', load_energy_solar_daily, 'kWh', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/energy/load_energy_solar_daily/state`, load_energy_solar_daily);
  await previousDay('load_energy_solar_daily', 'load_energy_solar_daily', 'energy');

  let load_energy_daily = (load_energy_grid + load_energy_solar_daily || 0);
  dataList.main.load_energy_daily = load_energy_daily;
  influxWrite('load_energy_daily', 'main', load_energy_daily, 'kWh', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/energy/load_energy_daily/state`, load_energy_daily);
  await previousDay('load_energy_daily', 'load_energy_daily', 'energy');

  let load_energy_cost_daily = load_energy_grid * POWER_COST;
  dataList.main.load_energy_cost_daily = load_energy_cost_daily;
  influxWrite('load_energy_cost_daily', 'main', load_energy_cost_daily, 'kWh', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/energy/load_energy_cost_daily/state`, load_energy_cost_daily);
  await previousDay('load_energy_cost_daily', 'load_energy_cost_daily', 'energy');
}
