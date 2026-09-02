import battery_sensors from './battery.js';
import energy_sensors from './energy.js'
import grid_sensors from './grid.js';
import load_sensors from './load.js';
import pv_sensors from './pv.js';
import schedule from './schedule.js';
import status_sensors from './status.js';
export { battery_sensors, grid_sensors, load_sensors, pv_sensors, status_sensors }
export default { ...battery_sensors, ...energy_sensors, ...grid_sensors, ...load_sensors, ...pv_sensors, ...schedule, ...status_sensors }
