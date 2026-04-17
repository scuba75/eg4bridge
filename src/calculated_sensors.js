'use strict'
const log = require('./logger')
const mqtt = require('./mqtt')
const { dataList } = require('./data_list')

const roundValue = (value, decimal_places)=>{
  return parseFloat((value || 0)?.toFixed(decimal_places || 2))
}
const calcBatteryRates = async(influxWrite, timeNow)=>{
  let bat_capacity = dataList.inverters['1']?.battery_capacity, bat_current = dataList.main?.battery_current, bat_soc = dataList?.main?.battery_soc
  if(!bat_capacity || !bat_soc) return

  let battery_discharge_rate = roundValue((bat_current < 0 && bat_capacity > 0) ? (( bat_current / bat_capacity ) * 100):0)
  let battery_charge_rate = roundValue((bat_current > 0 && bat_capacity > 0) ? (( bat_current / bat_capacity ) * 100):0)
  let battery_time_to_full = roundValue((battery_charge_rate > 0 && bat_soc < 100) ? ((100 - bat_soc) / battery_charge_rate): 0)
  let battery_time_to_empty = roundValue((battery_discharge_rate < 0 && bat_soc < 100) ? (bat_soc / -battery_discharge_rate ): 0)

  dataList.main.battery_discharge_rate = battery_discharge_rate
  influxWrite('battery_discharge_rate', 'main', battery_discharge_rate, '%/hr', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_discharge_rate/state`, battery_discharge_rate)

  dataList.main.battery_charge_rate = battery_charge_rate
  influxWrite('battery_charge_rate', 'main', battery_charge_rate, '%/hr', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_charge_rate/state`, battery_charge_rate)

  dataList.main.battery_time_to_full = battery_time_to_full
  influxWrite('battery_time_to_full', 'main', battery_time_to_full, 'h', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_time_to_full/state`, battery_time_to_full)

  dataList.main.battery_time_to_empty = battery_time_to_empty
  influxWrite('battery_time_to_empty', 'main', battery_time_to_empty, 'h', timeNow)
  await mqtt.sendSensorValue(`solar_inverter/main/battery_time_to_empty/state`, battery_time_to_empty)

}
module.exports = async(influxWrite, timeNow)=>{
  try{
    await calcBatteryRates(influxWrite, timeNow)
  }catch(e){
    log.error(e)
  }
}
