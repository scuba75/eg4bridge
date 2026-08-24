import log from '/app/src/logger.js';
import mainInverters from './main_inverters.js'
import microInverters from './micro_inverters.js'

export default async function(){
  let status = await mainInverters()
  if(status) status = await microInverters()
  return status
}
