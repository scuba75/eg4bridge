import log from '/app/src/logger.js';
import { MongoCache } from 'mongo-cache';
import { dataList } from '/app/src/data_list.js';

let MONGO_STATUS

const mongo = new MongoCache({
   connection_string: 'mongodb://mongo-home-internal.home.svc.cluster.local:27021?replicaSet=rs4&ssl=false&compressors=snappy&retryReads=true&retryWrites=true',
   db_name: 'inverter_monitor'
})

const collections = [
  { collection: 'daily', indexes: [
    { key: { TTL: 1 }, opts: { name: '_TTL', expireAfterSeconds: 7 * 24 * 3600 } }
  ] }
]
async function checkIndex(data){
    try{
        for(let i of data?.indexes){
            let status = await mongo.updateIndex( data.collection, i.key, i.opts )
            if(!status) return
        }
        return true;
    }catch(e){
        log.error(e)
    }
}
async function checkIndexes(){
    try{
       for(let i of collections){
            let status = await checkIndex(i);
            if(!status) return
       }
       return true;
    }catch(e){
        log.error(e)
    }
}
async function restoreValues(){
  let values_to_restore = [{ key: 'load_shedding', listKey: 'schedule' }]
  for(let i of values_to_restore){
    let data = await mongo.get('cache', { _id: i.key })
    if(data?.state) dataList[i.listKey][i.key] = data.state
  }
}
async function init(){
    try{
        let status = mongo.status()
        if(status) status = await checkIndexes()

        if(status){
            await restoreValues()
            MONGO_STATUS = true
            return;
        }
        setTimeout(init, 5000);
    }catch(e){
        log.error(e)
        setTimeout(init, 5000);
    }
}
init()

function status(){
  return MONGO_STATUS;
};
async function set(id, data, collection = 'cache'){
    try{
        if(!id || !data || !MONGO_STATUS) return;
        let timeNow = data?.updated || Date.now();
        return await mongo.set(collection, { _id: id }, data)
    }catch(e){
        log.error(e)
    }
}
async function get(id, collection = 'cache'){
    try{
        if(!id || !MONGO_STATUS) return;
        return await mongo.get(collection, { _id: id }, { _id: 0, TTL: 0 })
    }catch(e){
        log.error(e)
    }
}
async function all(collection = 'cache') {
    try{
       if(!MONGO_STATUS) return;
       return await mongo.all(collection, {}, { TTL: 0 })
    }catch(e){
        log.error(e)
    }
}
export default { status, set, get, all };