'use strict'
const log = require('./logger')
const Database  = require('better-sqlite3')
const SQLITE_TABLES = require('./sqlite_tables.json')
const DB_FILE = process.env.SQLITE_FILE || '/app/data/sqlite.db'

const db = new Database(DB_FILE)

let SQLITE_STATUS, SQLITE_STMT = {}

const expireSQLITE = async()=>{
  try{
    let timeNow = Date.now()
    for(let i in SQLITE_TABLES){
      if(!i || !SQLITE_TABLES[i]?.ttl || !SQLITE_STMT[i]?.expire) continue;
      log.debug(`Checking Expire for ${i}...`)
      await SQLITE_STMT[i].expire.run(timeNow - (+SQLITE_TABLES[i].ttl * 1000))
    }
    setTimeout(expireSQLITE, 10000)
  }catch(e){
    setTimeout(expireSQLITE, 5000)
    log.error(e)
  }
}
const init = async()=>{
  try{
    for(let i in SQLITE_TABLES){
      if(!i || !SQLITE_TABLES[i]?.schema) continue
      let status = await db.exec(SQLITE_TABLES[i].schema)
      log.info(`Table ${i} created...`)
      SQLITE_STMT[i] = { get: db.prepare(SQLITE_TABLES[i].get), set: db.prepare(SQLITE_TABLES[i].set) }
      if(SQLITE_TABLES[i].expire) SQLITE_STMT[i].expire = db.prepare(SQLITE_TABLES[i].expire)
      if(SQLITE_TABLES[i].all) SQLITE_STMT[i].all = db.prepare(SQLITE_TABLES[i].all)
    }
    SQLITE_STATUS = true
    expireSQLITE()
  }catch(e){
    log.error(e)
    setTimeout(init, 5000)
  }
}
init()
module.exports.status = ()=>{
  return SQLITE_STATUS
}
module.exports.set = async(id, data, table = 'cache') =>{
  try{
    if(!id || !data || !SQLITE_STATUS || !SQLITE_STMT[table]?.set) return

    let timeNow = data?.updated || Date.now()
    let payload = JSON.stringify(data)
    let res = await SQLITE_STMT[table]?.set.run({ id: id, data: payload, ttl: timeNow })
    if(res?.changes) return true

  }catch(e){
    log.error(e)
  }
}
module.exports.get = async(id, table = 'cache') =>{
  try{
    if(!id || !SQLITE_STATUS || !SQLITE_STMT[table]?.get) return

    let res = await SQLITE_STMT[table].get.get(id)
    if(!res?.data) return

    return JSON.parse(res.data)

  }catch(e){
    log.error(e)
  }
}
module.exports.all = async(table = 'cache') =>{
  try{

    if(!SQLITE_STATUS || !SQLITE_STMT[table]?.all) return
    
    let res = await SQLITE_STMT[table]?.all.all()
    if(!res || res?.length == 0) return

    let array = []
    for(let i in res){
      if(res[i].data) array.push(JSON.parse(res[i].data))
    }
    if(array?.length > 0) return array
  }catch(e){
    log.error(e)
  }
}
