import mqtt from '/app/src/mqtt/index.js';
import { dataList } from '/app/src/data_list.js';
import roundValue from '/app/src/helpers/round_value.js'

const POWER_COST = parseFloat(process.env.POWER_COST || "0.1044288425047438");

function getEstimatedTime(hDiff){
  let ms = Math.floor(Date.now() + (hDiff * 60 * 60 * 1000));
  let d = new Date(ms);

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return fmt.format(d);
};

export default async function(influxWrite, timeNow){
  let bat_capacity = dataList.inverters['1']?.battery_capacity, bat_current = dataList.main?.battery_current, bat_soc = dataList?.main?.battery_soc, battery_charge_soc_start = +(dataList?.main?.battery_charge_soc_start || 0);
  if (!bat_capacity || !bat_soc) return;

  let battery_discharge_rate = roundValue((bat_current < 0 && bat_capacity > 0) ? ((bat_current / bat_capacity) * 100) : 0);
  let battery_charge_rate = roundValue((bat_current > 0 && bat_capacity > 0) ? ((bat_current / bat_capacity) * 100) : 0);
  let battery_time_to_full = roundValue((battery_charge_rate > 0 && bat_soc < 100) ? ((100 - bat_soc) / battery_charge_rate) : 0);
  let battery_time_to_empty = roundValue((battery_discharge_rate < 0 && bat_soc < 100) ? (bat_soc / -battery_discharge_rate) : 0);
  let battery_estimated_full = battery_charge_rate > 0 ? getEstimatedTime(battery_time_to_full) : 'n/a';
  let battery_estimated_empty = battery_discharge_rate < 0 ? getEstimatedTime(battery_time_to_empty) : 'n/a';
  let battery_time_to_charge_soc = roundValue((battery_charge_rate > 0 && bat_soc < battery_charge_soc_start) ? ((battery_charge_soc_start - bat_soc) / battery_charge_rate) : 0);
  let battery_estimated_charge_soc = battery_time_to_charge_soc > 0 ? getEstimatedTime(battery_time_to_charge_soc) : 'n/a';

  dataList.main.battery_discharge_rate = battery_discharge_rate;
  influxWrite('battery_discharge_rate', 'main', battery_discharge_rate, '%/hr', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/battery/battery_discharge_rate/state`, battery_discharge_rate);

  dataList.main.battery_charge_rate = battery_charge_rate;
  influxWrite('battery_charge_rate', 'main', battery_charge_rate, '%/hr', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/battery/battery_charge_rate/state`, battery_charge_rate);

  dataList.main.battery_time_to_full = battery_time_to_full;
  influxWrite('battery_time_to_full', 'main', battery_time_to_full, 'h', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/battery/battery_time_to_full/state`, battery_time_to_full);

  dataList.main.battery_estimated_full = battery_estimated_full;
  await mqtt.sendSensorValue(`solar_inverter/battery/battery_estimated_full/state`, battery_estimated_full);

  dataList.main.battery_estimated_empty = battery_estimated_empty;
  await mqtt.sendSensorValue(`solar_inverter/battery/battery_estimated_empty/state`, battery_estimated_empty);

  dataList.main.battery_time_to_empty = battery_time_to_empty;
  influxWrite('battery_time_to_empty', 'main', battery_time_to_empty, 'h', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/battery/battery_time_to_empty/state`, battery_time_to_empty);

  dataList.main.battery_time_to_charge_soc = battery_time_to_charge_soc;
  influxWrite('battery_time_to_charge_soc', 'main', battery_time_to_charge_soc, 'h', timeNow);
  await mqtt.sendSensorValue(`solar_inverter/battery/battery_time_to_charge_soc/state`, battery_time_to_charge_soc);

  dataList.main.battery_estimated_charge_soc = battery_estimated_charge_soc;
  await mqtt.sendSensorValue(`solar_inverter/battery/battery_estimated_charge_soc/state`, battery_estimated_charge_soc);
}
