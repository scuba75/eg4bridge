export default {
  pv_energy_dc: { name: `Energy {{NUM}} (DC)`, topic: `pv_energy_dc`, config: { state_class: 'total', unit_of_measurement: 'kWh', device_class: 'energy' } },
  pv_power_dc: { name: `Power {{NUM}} (DC)`, topic: `pv_power_dc`, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_voltage_dc: { name: `Voltage {{NUM}} (DC)`, topic: `pv_voltage_dc`, config: { state_class: 'measurement', unit_of_measurement: 'V', device_class: 'voltage' } },
  pv_current_dc: { name: `Current {{NUM}} (DC)`, topic: `pv_current_dc`, config: { state_class: 'measurement', unit_of_measurement: 'A', device_class: 'current' } }
}
