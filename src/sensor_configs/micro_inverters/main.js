export default {
  pv_energy_daily: { name: `Energy (Daily)`, topic: `pv_energy_daily`, main: true, config: { state_class: 'total', unit_of_measurement: 'kWh', device_class: 'energy' } },
  pv_energy_total: { name: `Energy (Total)`, topic: `pv_energy_total`, main: true, config: { state_class: 'total', unit_of_measurement: 'kWh', device_class: 'energy' } },
  pv_power_ac: { name: `Power`, topic: `pv_power_ac`, main: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_ac_1: { name: `Power 1`, topic: `pv_power_ac_1`, main: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  pv_power_ac_2: { name: `Power 2`, topic: `pv_power_ac_2`, main: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  ip_address: { name: `IP Address`, topic: `ip_address`, main: true, config: { icon: 'mdi:ip-network' } },
  status: { name: `Status`, topic: `status`, main: true, sensor_type: 'binary_sensor', retain: true, config: { device_class: 'power' } }
}
