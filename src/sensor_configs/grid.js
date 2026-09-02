export default {
  ac_charge_power: { name: 'AC Power Charge', topic: 'ac_charge_power', id: 'grid', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  grid_available: { name: 'Grid Available', topic: 'grid_available', id: 'grid', main: 'master', sensor_type: 'binary_sensor', unit_of_measurement: 'status', config: { device_class: 'connectivity', icon: 'mdi:transmission-tower' } },
  grid_current: { name: 'Grid Current', topic: 'grid_current', id: 'grid', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'A', device_class: 'current' } },
  grid_importing: { name: 'Grid Importing', topic: 'grid_importing', id: 'grid', main: 'master', sensor_type: 'binary_sensor', unit_of_measurement: 'status', config: { icon: 'mdi:transmission-tower-import' } },
  grid_power_importing: { name: 'Grid Power', topic: 'grid_power_importing', id: 'grid', main: 'both', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'W', device_class: 'power' } },
  grid_voltage: { name: 'Grid Voltage', topic: 'grid_voltage', id: 'grid', main: 'master', individual: true, config: { state_class: 'measurement', unit_of_measurement: 'V', device_class: 'voltage' } }
}
