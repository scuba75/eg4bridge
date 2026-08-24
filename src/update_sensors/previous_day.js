import log from '/app/src/logger.js';
import cache from '/app/src/cache/index.js';
import mqtt from '/app/src/mqtt/index.js';

function getPreviousDate() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .formatToParts(new Date(Date.now() - (24 * 60 * 60 * 1000)))
      .map(p => [p.type, p.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export default async (sensor_id, sensor_topic) => {
  try {
    if (!sensor_id || !sensor_topic) return;
    let key = getPreviousDate();
    if (!key) return;

    let data = await cache.get(key, 'daily');

    if (!data?.main) return;

    let value = data.main[sensor_id] || 0;

    mqtt.publish(`solar_inverter/main/${sensor_topic?.replace('_daily', '_yesterday')}/state`, value?.toString());

  } catch (e) {
    log.error(e);
  }
};
