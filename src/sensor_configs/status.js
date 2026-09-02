export default {
  active_fault_text: { name: 'Active Fault', topic: 'active_fault_text', id: 'status', unit_of_measurement: 'status', individual: true, config: { icon: 'mdi:alert-circle' } },
  active_warning_text: { name: 'Active Warning', topic: 'active_warning_text', id: 'status', unit_of_measurement: 'status', individual: true, config: { icon: 'mdi:alert' } },
  master_slave: { name: 'Master Inverter', topic: 'master_slave', id: 'status', unit_of_measurement: 'status', main: 'master', config: { icon: 'mdi:state-machine' } },
  role: { name: 'Role', topic: 'role', id: 'status', individual: 'true', unit_of_measurement: 'status', config: { icon: 'mdi:account' } },
  status_text: { name: 'Status', topic: 'status_text', id: 'status', main: 'master', unit_of_measurement: 'status', individual: true, config: { icon: 'mdi:state-machine' } },
  temperature: { name: 'Temperature', topic: 'temperature', id: 'status', main: 'average', individual: true, config: { state_class: 'measurement', unit_of_measurement: '°C', device_class: 'temperature' } },
  updated: { name: 'Data Updated', topic: 'updated', id: 'status', main: 'master', unit_of_measurement: 'status', config: { entity_category: 'diagnostic', device_class: 'timestamp', value_template: '{{ int(value) | timestamp_local }}' } }
}
