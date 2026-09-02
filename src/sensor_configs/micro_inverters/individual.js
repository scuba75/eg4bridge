export default {
  pv_energy_ac: { name: `Energy (AC)`, topic: `pv_energy_ac`, config: { state_class: 'total', unit_of_measurement: 'kWh', device_class: 'energy' } },
  pv_power_ac: { name: `Power (AC)`, topic: `pv_power_ac`, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_voltage_ac: { name: `Voltage (AC)`, topic: `pv_voltage_ac`, config: { state_class: 'measurement', unit_of_measurement: 'V', device_class: 'voltage' } },
  pv_current_ac: { name: `Current (AC)`, topic: `pv_current_ac`, config: { state_class: 'measurement', unit_of_measurement: 'A', device_class: 'current' } },
  pv_inverter_temperature_ac: { name: `Temperature`, topic: `pv_inverter_temperature_ac`, config: { state_class: 'measurement', unit_of_measurement: '°C', device_class: 'temperature' } },
  pv_inverter_serial_number: { name: `Serial`, topic: `pv_inverter_serial_number` },
  status: { name: `Status`, topic: `status`, main: true, sensor_type: 'binary_sensor', retain: true, config: { device_class: 'power' } }
}
