import log from '/app/src/logger.js'
const OPEN_LUX_AUTH = process.env.OPEN_LUX_AUTH

async function parseResponse(r){
  let contentType = r?.headers.get("content-type")
  if(contentType && contentType?.indexOf("application/json") !== -1) return await r?.json()
}

async function reboot(ip_address, inverter_num){
    try{
        let opts = { signal: AbortSignal.timeout(5000), method: 'POST' }
        if(OPEN_LUX_AUTH) opts.headers = { 'Authorization': `Basic ${OPEN_LUX_AUTH}` }
        await fetch(`http://${ip_address}/api/cmd?cmd=reboot`, opts) 
    }catch(e){
        log.info(`Reseting inverter ${inverter_num} bridge`)
    }
}
async function status(ip_address){
    try{
        let opts = { signal: AbortSignal.timeout(5000), method: 'POST' }
        if(OPEN_LUX_AUTH) opts.headers = { 'Authorization': `Basic ${OPEN_LUX_AUTH}` }
        let r = await fetch(`http://${ip_address}/api/cmd?cmd=status`, opts)
        let res = await parseResponse(r)
        if(!r.ok) return
        if(res?.ok && res?.message?.startsWith('Link: UP')) return true
        console.log(res)
    }catch(e){
        log.error(e)
    }
}
export default { reboot, status }