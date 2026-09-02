let data = new Map()

function get(key){
  let tempObj = data.get(key)
  if(tempObj) return JSON.parse(JSON.stringify(tempObj))
}
function set(key, value){
  return data.set(key, value)
}
export default { get, set }
