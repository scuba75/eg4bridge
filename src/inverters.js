'use strict'
const log = require('./logger')
const cache = require('./sqlite')
const mqtt = require('./mqtt')
const schedule = require('./schedule')
const updateSensors = require('./update_sensors')

const SYSTEM_CONFIGS = require('/app/data/config.json')
const INVERTER_CONFIGS = SYSTEM_CONFIGS?.inverters
const POWER_CONFIGS = SYSTEM_CONFIGS?.max_powers
const SENSOR_CONFIGS = require('./sensor_configs')

const { EG4Bridge } = require('./eg4_bridge');
const { dataList } = require('./data_list')

let INPUT_UPDATE_MS = +(process.env.INPUT_UPDATE_MS || 5000), HOLD_UPDATE_MS = +(process.env.HOLD_UPDATE_MS || 10000), INVERTERS = {}, INVERTERS_STATUS

const init = ()=>{
  try{
    if(!INVERTER_CONFIGS || INVERTER_CONFIGS?.length == 0){
      log.error(`Inverter Config not defined...`)
      setTimeout(init, 5000)
      return
    }
    for(let i in POWER_CONFIGS){
      if(!i || !POWER_CONFIGS[i]) continue;
      dataList.main[`${i}_max`] = POWER_CONFIGS[i]
    }
    for(let i in INVERTER_CONFIGS){
      if(!i || !INVERTER_CONFIGS[i]?.host) continue
      let inverter_num = +(+i +1);
      INVERTERS[inverter_num] = new EG4Bridge({
        ...INVERTER_CONFIGS[i],
        inverter_num: inverter_num,
        updateIntervalMs: INPUT_UPDATE_MS,
        holdIntervalMs: HOLD_UPDATE_MS
      })
      dataList.inverters[inverter_num] = { serial: INVERTER_CONFIGS[i].inverterSerial, inverter_num: inverter_num }

      INVERTERS[inverter_num].on('log', (e) => {
        if(log[e?.level]){
          log[e.level](`[inverter_${e.inverter_num}] ${e.msg}`)
        }else{
          console.log(`[${e.level}][inverter_${e.inverter_num}] ${e.msg}`)
        }
      })
      INVERTERS[inverter_num].on('scan_status', (d) => log.error(`[inverter_${d.inverter_num}][scan] ${d.msg}`));

      INVERTERS[inverter_num].on('connected', (d) => log.info(`Inverter ${d.inverter_num} Connected!`));

      INVERTERS[inverter_num].on('data', (d)=>{
        if(!d?.data || !d?.inverter_num) return
        if(!dataList.inverters[d?.inverter_num]) return

        updateSensors(d.inverter_num, d.data)
      });
      if(inverter_num == 1){
        log.info(`Setting up hold_data reporting for Inverter ${inverter_num}...`)
        INVERTERS[inverter_num].on('hold_data', async(d)=>{
          if(!d?.data?.schedule) return;

          for(let i in d.data.schedule){
            if(!i || !d?.data?.schedule || !d?.data?.schedule[i] || !d.data.schedule[i]?.raw) continue

            let decodedValue = schedule.decode(d.data.schedule[i].raw)
            if(!decodedValue) continue;

            if(!dataList.schedule) dataList.schedule = {}
            dataList.schedule[i] = decodedValue

            let topic = SENSOR_CONFIGS[i]?.topic
            if(topic) mqtt.publish(`solar_inverter/main/${topic}/state`, decodedValue?.toString())

            let desired = await cache.get(i)
            if(!desired?.raw){
              await cache.set(i, { raw: d.data.schedule[i].raw, decodedValue: decodedValue, register: d.data.schedule[i].register })
              desired = cache.get(i)
            }
            if(desired?.decodedValue && topic){
              let desired_topic = topic?.replace('_actual', '_desired')
              if(!dataList.schedule) dataList.schedule = {}
              dataList.schedule[desired_topic] = desired?.decodedValue
              mqtt.publish(`solar_inverter/main/${desired_topic}/state`, desired?.decodedValue?.toString())
            }
            if(desired?.raw != d.data.schedule[i].raw && d.data.schedule[i].register > 0 && desired?.raw >= 0) INVERTERS[inverter_num].queueWrite(d.data.schedule[i].register, desired.raw)
          }
        });
      }
    }
    INVERTERS_STATUS = true
  }catch(e){
    setTimeout(init, 5000)
    log.error(e)
  }
}
init()
module.exports.start = () =>{
  try{
    for(let i in INVERTERS){
      if(!INVERTERS[i]) continue
      INVERTERS[i].start()
    }
    return true
  }catch(e){
    log.error(e)
  }
}
module.exports.status = ()=>{
  return INVERTERS_STATUS
}
