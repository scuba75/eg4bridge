'use strict';

const { EG4Bridge } = require('./eg4Bridge');
const fs = require('fs')

function encodeHHMM(hour, minute) {
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Invalid time');
  }
  return (minute << 8) | hour;
}

function decodeHHMM(raw) {
  const hour = raw & 0xFF;
  const minute = (raw >> 8) & 0xFF;
  if (hour > 23 || minute > 59) return null;
  return `${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
}

let data = {}, count = 0
const client = new EG4Bridge({
  host: '172.20.2.38',          // or leave blank and use scanDongle()
  port: 8000,
  dongleSerial: '0123456789',    // 10 chars
  inverterSerial: '53262J0115',  // 10 chars
  updateIntervalMs: 5000,
  holdIntervalMs: 10000,
});

client.on('log', (e) => console.log(`[${e.level}] ${e.msg}`));
client.on('scan_status', (s) => console.log(`[scan] ${s}`));

client.on('connected', () => console.log('Connected!'));

client.on('data', (d)=>{
  for(let i in d){
    if(!i) continue;
    if(!d[i] && +d[i] != 0 ) continue;
    data[i] = d[i]
  }
});

client.on('hold_data', (d)=>{
  if(!d?.schedule) return;

  for(let i in d.schedule){
    if(!i || !d.schedule[i]) continue;
    data[i] = { raw: d.schedule[i], decoded: decodeHHMM(d.schedule[i]) }
  }
  count++
});

const check = ()=>{
  try{
    if(count > 5){
      fs.writeFileSync('./data.json', JSON.stringify(data, null, 2))
      console.log('data.json created...')
      return
    }
    setTimeout(check, 5000)
  }catch(e){
    console.errror(e)
    setTimeout(check, 5000)
  }
}
check()
client.start()
//setTimeout(updateStart, 20000)
// Optional: scan if host is unknown
// (async () => {
//   const found = await client.scanDongle();
//   console.log('Scan result:', found);
// })();
