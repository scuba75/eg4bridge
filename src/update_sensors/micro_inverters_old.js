import log from '/app/src/logger.js';
import { dataList } from '/app/src/data_list.js';
import mqtt from '/app/src/mqtt/index.js';
import previousDay from './previous_day.js';

let MICRO_INVERTER_SN = [], OPENDTU_HOST = process.env.OPENDTU_HOST, OPENDTU_AUTH = process.env.OPENDTU_AUTH;
if (process.env.MICRO_INVERTER_SN) MICRO_INVERTER_SN = JSON.parse(process.env.MICRO_INVERTER_SN);

function roundValue(value, decimal_places) {
  return parseFloat((value || 0)?.toFixed(decimal_places || 2));
}

async function parseResponse(r) {
  let contentType = r?.headers.get("content-type");
  if (contentType && contentType?.indexOf("application/json") !== -1) return await r?.json();
}

async function getInverterData(serialNumber) {
  try {
    let opts = { method: 'GET', headers: { 'Authorization': `Basic ${OPENDTU_AUTH}` }, signal: AbortSignal.timeout(10000) };
    let r = await fetch(`http://${OPENDTU_HOST}/api/livedata/status?inv=${serialNumber}`, opts);
    let res = await parseResponse(r);
    if (!r.ok) {
      if (res) log.error(JSON.stringify(res));
      return;
    }
    return res;
  } catch (e) {
    log.error(e);
  }
}
async function updateInverterData(inverter_num, influxWrite, timeNow, data) {
  try {
    if (!data?.AC || !data?.DC || !dataList?.inverters[inverter_num]) return;
    if (!dataList.micro_inverters[inverter_num]) dataList.micro_inverters[inverter_num] = { sn: MICRO_INVERTER_SN[+inverter_num - 1] };
    dataList.inverters[inverter_num].pv_energy_ac_daily = roundValue((+(data?.INV["0"]?.YieldDay?.v || 0)) / 1000, 1);

    dataList.micro_inverters[inverter_num].pv_inverter_temperature_ac = roundValue((+(data?.INV["0"]?.Temperature?.v || 0)), 1);
    await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_inverter_temperature_ac/state`, dataList.micro_inverters[inverter_num].pv_inverter_temperature_ac);

    dataList.micro_inverters[inverter_num].pv_energy_ac_daily = dataList.inverters[inverter_num].pv_energy_ac_daily;
    await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_energy_ac/state`, dataList.micro_inverters[inverter_num].pv_energy_ac_daily);

    dataList.micro_inverters[inverter_num].pv_power_ac = parseInt(data?.AC["0"]?.Power?.v || 0);
    await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_power_ac/state`, dataList.micro_inverters[inverter_num].pv_power_ac);
    await mqtt.sendSensorValue(`micro_inverter/main/pv_power_ac_${inverter_num}/state`, dataList.micro_inverters[inverter_num].pv_power_ac);
    await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/status/state`, dataList.micro_inverters[inverter_num].pv_power_ac > 19 ? 'ON':'OFF')

    dataList.micro_inverters[inverter_num].pv_voltage_ac = parseInt(data?.AC["0"]?.Voltage?.v || 0);
    await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_voltage_ac/state`, dataList.micro_inverters[inverter_num].pv_voltage_ac);

    dataList.micro_inverters[inverter_num].pv_current_ac = roundValue((+(data?.AC["0"]?.Current?.v || 0)), 2);
    await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_current_ac/state`, dataList.micro_inverters[inverter_num].pv_current_ac);

    for (let i in data.DC) {
      if (!data?.DC[i]) continue;
      dataList.micro_inverters[inverter_num][`pv_energy_dc_${i}`] = roundValue((+(data.DC[i]?.YieldDay.v || 0)) / 1000, 1);
      await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_energy_dc_${i}/state`, dataList.micro_inverters[inverter_num][`pv_energy_dc_${i}`]);

      dataList.micro_inverters[inverter_num][`pv_power_dc_${i}`] = parseInt(data.DC[i]?.Power.v || 0);
      await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_power_dc_${i}/state`, dataList.micro_inverters[inverter_num][`pv_power_dc_${i}`]);

      dataList.micro_inverters[inverter_num][`pv_voltage_dc_${i}`] = parseInt(data.DC[i]?.Voltage.v || 0);
      await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_voltage_dc_${i}/state`, dataList.micro_inverters[inverter_num][`pv_voltage_dc_${i}`]);

      dataList.micro_inverters[inverter_num][`pv_current_dc_${i}`] = roundValue(+(data.DC[i]?.Current.v || 0), 2);
      await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_current_dc_${i}/state`, dataList.micro_inverters[inverter_num][`pv_current_dc_${i}`]);
    }
    await mqtt.sendSensorValue(`solar_inverter/${inverter_num}/pv_energy_ac_daily/state`, dataList.inverters[inverter_num].pv_energy_ac_daily);
    influxWrite('pv_energy_ac_daily', `inverter_${inverter_num}`, dataList.inverters[inverter_num].pv_energy_ac_daily, 'kWh', timeNow);
  } catch (e) {
    log.error(e);
  }
}

export default async (inverter_num, influxWrite, timeNow) => {
  try {
    //return
    if (MICRO_INVERTER_SN?.length == 0 || !OPENDTU_HOST) return;
    let inverter_sn = MICRO_INVERTER_SN[+inverter_num - 1];
    if (!inverter_sn) return;

    await mqtt.sendSensorValue(`micro_inverter/${inverter_num}/pv_inverter_serial_number/state`, inverter_sn);

    let data = await getInverterData(inverter_sn);
    if (!data?.total || !data?.inverters) return;

    if (data?.inverters?.length > 0) await updateInverterData(inverter_num, influxWrite, timeNow, data.inverters[0]);
    if (data?.total && dataList?.main) {
      let pv_energy_total = roundValue((+(data?.total?.YieldDay?.v || 0)) / 1000, 1);
      if (pv_energy_total == 0 || pv_energy_total >= (dataList.main.pv_energy_ac_daily || 0)) dataList.main.pv_energy_ac_daily = pv_energy_total;
      await mqtt.sendSensorValue(`solar_inverter/main/pv_energy_ac_daily/state`, pv_energy_total);
      influxWrite('pv_energy_ac_daily', `main`, pv_energy_total, 'kWh', timeNow);
      await previousDay('pv_energy_ac_daily', 'pv_energy_ac_daily');
      await mqtt.sendSensorValue(`micro_inverter/main/pv_energy_daily/state`, pv_energy_total);
      await mqtt.sendSensorValue(`micro_inverter/main/ip_address/state`, OPENDTU_HOST);

      await mqtt.sendSensorValue(`micro_inverter/main/pv_energy_total/state`, roundValue(+(data.total?.YieldTotal?.v || 0)));
      await mqtt.sendSensorValue(`micro_inverter/main/pv_power_ac/state`, roundValue(+(data.total?.Power?.v || 0)));
      let inverter_status = 'OFF'
      if(+(data.total?.Power?.v || 0) > 19) inverter_status = 'ON'
      await mqtt.sendSensorValue(`micro_inverter/main/status/state`, inverter_status)
    }
  } catch (e) {
    log.error(e);
  }
};
