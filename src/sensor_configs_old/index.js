import battery from './battery.json' with { type: 'json' };
import grid from './grid.json' with { type: 'json' };
import load from './load.json' with { type: 'json' };
import pv from './pv.json' with { type: 'json' };
import schedule from './schedule.json' with { type: 'json' };
import status from './status.json' with { type: 'json' };

export default { ...battery, ...grid, ...load, ...pv, ...schedule, ...status };
