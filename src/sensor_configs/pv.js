export default {
  ac_couple_pwr: { name: 'PV Power (AC)', topic: 'ac_couple_pwr', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_current_1: { name: 'PV Current 1', topic: 'pv_current_1', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'A', device_class: 'current' } },
  pv_current_2: { name: 'PV Current 2', topic: 'pv_current_2', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'A', device_class: 'current' } },
  pv_power: { name: 'PV Power', topic: 'pv_power', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_dc: { name: 'PV Power (DC)', topic: 'pv_power_dc', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_1: { name: 'PV Power 1', topic: 'pv_power_1', id: 'pv', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_2: { name: 'PV Power 2', topic: 'pv_power_2', id: 'pv', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_charge: { name: 'PV Power Charge', topic: 'pv_power_charge', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_charge_dc: { name: 'PV Power Charge (DC)', topic: 'pv_power_charge_dc', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_load: { name: 'PV Power Load', topic: 'pv_power_load', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_load_dc: { name: 'PV Power Load (DC)', topic: 'pv_power_load_dc', id: 'pv', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_voltage_1: { name: 'PV Voltage 1', topic: 'pv_voltage_1', id: 'pv', main: 'average', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'V', device_class: 'voltage' } },
  pv_voltage_2: { name: 'PV Voltage 2', topic: 'pv_voltage_2', id: 'pv', main: 'average', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'V', device_class: 'voltage' } }
}
