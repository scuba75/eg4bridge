import log from '/app/src/logger.js';
import cache from '/app/src/cache/index.js';
import schedule from './schedule.js';

import sensors from '/app/src/sensor_configs/schedule.json' with { type: 'json' };

export default (topic, msg) => {
  if (!sensors[topic]) return;
  if (!cache.status()) return;
  let data = { raw: schedule.encode(msg), decodedValue: msg, register: sensors[topic].register };
  cache.set(topic, data);
  log.info(`Set desired value for ${topic} to ${msg} (${data.raw})`);
};
