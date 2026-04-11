'use strict'
const log = require('./logger')
const fs = require('fs')
let CACHE_DATA = {}, CACHE_READY

const saveData = () =>{
  try{
    let dataFile = `${baseDir}/data/data.json`
    fs.writeFileSync(dataFile, JSON.stringify({ data: CACHE_DATA, updated: Date.now() }))
    log.debug(`Cache backed up to ${dataFile}`)
    return true
  }catch(e){
    log.error(e)
  }
}
const restoreData = async()=>{
  try{
    let dataFile = `${baseDir}/data/data.json`
    let obj = await fs.readFileSync(dataFile)
    if(obj){
      let json = JSON.parse(obj)
      if(json?.data) CACHE_DATA = json.data
    }
  }catch(e){
    log.error(e)
  }
}
const init = async()=>{
  try{
    await restoreData()
    await saveData()
    log.info(`eg4Bridge cache is ready...`)
    CACHE_READY = true
  }catch(e){
    log.error(e)
  }
}
init()
module.exports.set = async(id, data)=>{
  if(!id || !data) return
  if(!CACHE_READY) return

  CACHE_DATA[id] = data
  await saveData()
}
module.exports.get = (id)=>{
  if(!id) return
  if(!CACHE_READY) return

  return CACHE_DATA[id]
}
module.exports.status = ()=>{
  return CACHE_READY
}
