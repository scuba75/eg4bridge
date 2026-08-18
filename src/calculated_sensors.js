'use strict'
const log = require('./logger')
const mqtt = require('./mqtt')
const previousDay = require('./previous_day')

const { dataList } = require('./data_list')

const POWER_COST = parseFloat(process.env.POWER_COST || "0.1044288425047438")

const roundValue = (value, decimal_places)=>{
  return parseFloat((value || 0)?.toFixed(decimal_places || 2))
}

const getEstimatedTime = (hDiff)=>{
  let ms = Math.floor( Date.now() + (hDiff * 60 * 60 * 1000))
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
}
const calcBatteryRates = async(influxWrite, timeNow)=>{
  let bat_capacity = dataList.inverters['1']?.battery_capacity, bat_current = dataList.main?.battery_current, bat_soc = dataList?.main?.battery_soc, battery_charge_soc_start = +(dataList?.main?.battery_charge_soc_start || 0)
  if(!bat_capacity || !bat_soc) return

  let battery_discharge_rate = roundValue((bat_current < 0 && bat_capacity > 0) ? (( bat_current / bat_capacity ) * 100):0)
  let battery_charge_rate = roundValue((bat_current > 0 && bat_capacity > 0) ? (( bat_current / bat_capacity ) * 100):0)
  let battery_time_to_full = roundValue((battery_charge_rate > 0 && bat_soc < 100) ? ((100 - bat_soc) / battery_charge_rate): 0)
  let battery_time_to_empty = roundValue((battery_discharge_rate < 0 && bat_soc < 100) ? (bat_soc / -battery_discharge_rate ): 0)
  let battery_estimated_full = battery_charge_rate > 0 ? getEstimatedTime(battery_time_to_full):'n/a'
  let battery_estimated_empty = battery_discharge_rate < 0 ? getEstimatedTime(battery_time_to_empty):'n/a'
  let battery_time_to_charge_soc = roundValue((battery_charge_rate > 0 && bat_soc < battery_charge_soc_start) ? ((battery_charge_soc_start - bat_soc) / battery_charge_rate): 0)
  let battery_estimated_charge_soc = battery_time_to_charge_soc > 0 ? getEstimatedTime(battery_time_to_charge_soc):'n/a'

  dataList.main.battery_discharge_rate = battery_discharge_rate
  influxWrite('battery_discharge_rate', 'main', battery_discharge_rate, '%/hr', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_discharge_rate/state`, battery_discharge_rate)

  dataList.main.battery_charge_rate = battery_charge_rate
  influxWrite('battery_charge_rate', 'main', battery_charge_rate, '%/hr', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_charge_rate/state`, battery_charge_rate)

  dataList.main.battery_time_to_full = battery_time_to_full
  influxWrite('battery_time_to_full', 'main', battery_time_to_full, 'h', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_time_to_full/state`, battery_time_to_full)

  dataList.main.battery_estimated_full = battery_estimated_full
  await mqtt.sendSensorValue(`solar_inverter/main/battery_estimated_full/state`, battery_estimated_full)

  dataList.main.battery_estimated_full = battery_estimated_empty
  await mqtt.sendSensorValue(`solar_inverter/main/battery_estimated_empty/state`, battery_estimated_empty)

  dataList.main.battery_time_to_empty = battery_time_to_empty
  influxWrite('battery_time_to_empty', 'main', battery_time_to_empty, 'h', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_time_to_empty/state`, battery_time_to_empty)

  dataList.main.battery_time_to_charge_soc = battery_time_to_charge_soc
  influxWrite('battery_time_to_charge_soc', 'main', battery_time_to_charge_soc, 'h', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_time_to_charge_soc/state`, battery_time_to_charge_soc)

  dataList.main.battery_estimated_charge_soc = battery_estimated_charge_soc
  await mqtt.sendSensorValue(`solar_inverter/main/battery_estimated_charge_soc/state`, battery_estimated_charge_soc)

  let pv_power_1 = +(dataList.inverters['1']?.pv_power_dc || 0) + +(dataList.inverters['1']?.ac_couple_pwr || 0), pv_power_2 = +(dataList.inverters['2']?.pv_power_dc || 0) + +(dataList.inverters['2']?.ac_couple_pwr || 0)
  let pv_power = +(pv_power_1 || 0) + +(pv_power_2 || 0)
  dataList.inverters['1'].pv_power = pv_power_1
  dataList.inverters['2'].pv_power = pv_power_2
  dataList.main.pv_power = pv_power
  influxWrite('pv_power', '1', pv_power_1, 'W', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/1/pv_power/state`, pv_power_1)
  influxWrite('pv_power', '2', pv_power_2, 'W', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/2/pv_power/state`, pv_power_2)
  influxWrite('pv_power', 'main', pv_power, 'W', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/pv_power/state`, pv_power)

  let pv_energy_daily_1 = (dataList.inverters['1']?.pv_energy_dc_daily || 0) + (dataList.inverters['1']?.pv_energy_ac_daily || 0), pv_energy_daily_2 = (dataList.inverters['2']?.pv_energy_dc_daily || 0) + (dataList.inverters['2']?.pv_energy_ac_daily || 0)
  let pv_energy_daily = (pv_energy_daily_1 || 0) + (pv_energy_daily_2 || 0)
  dataList.inverters['1'].pv_energy_daily = pv_energy_daily_1 || 0
  dataList.inverters['2'].pv_energy_daily = pv_energy_daily_2 || 0
  dataList.main.pv_energy_daily = pv_energy_daily
  influxWrite('pv_energy_daily', '1', pv_energy_daily_1, 'kWh', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/1/pv_energy_daily/state`, pv_energy_daily_1)
  influxWrite('pv_energy_daily', '2', pv_energy_daily_2, 'kWh', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/2/pv_energy_daily/state`, pv_energy_daily_2)
  influxWrite('pv_energy_daily', 'main', pv_energy_daily, 'kWh', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/pv_energy_daily/state`, pv_energy_daily)
  await previousDay('pv_energy_daily', 'pv_energy_daily')

  let battery_energy_charge_solar = (dataList.main.battery_energy_charge_solar_daily || 0), load_energy_grid = (dataList.main.load_energy_grid_daily || 0)

  let load_energy_solar_daily = roundValue(pv_energy_daily > battery_energy_charge_solar ? (pv_energy_daily - battery_energy_charge_solar || 0):0)
  dataList.main.load_energy_solar_daily = load_energy_solar_daily
  influxWrite('load_energy_solar_daily', 'main', load_energy_solar_daily, 'kWh', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/load_energy_solar_daily/state`, load_energy_solar_daily)
  await previousDay('load_energy_solar_daily', 'load_energy_solar_daily')

  let load_energy_daily = (load_energy_grid + load_energy_solar_daily || 0)
  dataList.main.load_energy_daily = load_energy_daily
  influxWrite('load_energy_daily', 'main', load_energy_daily, 'kWh', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/load_energy_daily/state`, load_energy_daily)
  await previousDay('load_energy_daily', 'load_energy_daily')

  let load_energy_cost_daily = load_energy_grid * POWER_COST
  dataList.main.load_energy_cost_daily = load_energy_cost_daily
  influxWrite('load_energy_cost_daily', 'main', load_energy_cost_daily, 'kWh', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/load_energy_cost_daily/state`, load_energy_cost_daily)
  await previousDay('load_energy_cost_daily', 'load_energy_cost_daily')

}
module.exports = async(influxWrite, timeNow)=>{
  try{
    await calcBatteryRates(influxWrite, timeNow)
  }catch(e){
    log.error(e)
  }
}
