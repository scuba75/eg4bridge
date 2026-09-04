const TIME_ZONE = process.env.TIME_ZONE || 'America/New_York'
export function getTimeParts(){
  let time = new Date()
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(time);
}
export function checkTimeEnd(hour_minute, time_window = 5){
  let array = hour_minute?.split(':')
  if(!array || array?.length < 2) return
  let hour = parseInt(array[0]), minute = parseInt(array[1]), time = new Date();

  let parts = getTimeParts()

  let tzHour   = Number(parts.find(p => p.type === 'hour').value) % 24;
  let tzMinute = Number(parts.find(p => p.type === 'minute').value);

  let nowMins = tzHour * 60 + tzMinute;
  let endMins = hour * 60 + minute + time_window;
  return nowMins < endMins
}
export function checkTimeStart(hour_minute, time_window = 5){
  let array = hour_minute?.split(':')
  if(!array || array?.length < 2) return
  let hour = parseInt(array[0]), minute = parseInt(array[1]), time = new Date();

  let parts = getTimeParts()

  let tzHour   = Number(parts.find(p => p.type === 'hour').value) % 24;
  let tzMinute = Number(parts.find(p => p.type === 'minute').value);

  let nowMins = tzHour * 60 + tzMinute;
  let startMins = hour * 60 + minute - time_window;
  return nowMins >= startMins
}
export function checkTimeBetween(time_start, time_end, time_window_start = 5, time_window_end = 5){
  let pastStart = checkTimeStart(time_start, time_window_start), beforeEnd = checkTimeEnd(time_end, time_window_end)
  return (pastStart && beforeEnd)
}
