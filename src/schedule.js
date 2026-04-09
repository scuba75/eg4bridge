'use strict'
const log = require('./logger')
module.exports.decode = (raw) => {
  const hour = raw & 0xFF;
  const minute = (raw >> 8) & 0xFF;
  if (hour > 23 || minute > 59) return null;
  return `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
}
module.exports.encode = (timeValue) => {
  try{
    if(!timeValue) return
    let array = timeValue.split(':')
    if(!array || array.length < 2) return

    let hour = +array[0], minute = +array[1]

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Invalid time');
    }
    return (minute << 8) | hour;
  }catch(e){
    log.error(e)
  }
}
