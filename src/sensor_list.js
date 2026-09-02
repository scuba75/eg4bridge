let data = new Map()

function get(key){
  return data.get(key)
}
function set(key, value){
  return data.set(key, value)
}
export default { get, set }
