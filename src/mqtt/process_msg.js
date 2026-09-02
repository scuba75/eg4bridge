import log from '/app/src/logger.js';

import Cmds from '/app/src/cmds/index.js'

export default async function(topic, value){
  let array = topic.split('/')
  if(!array || array?.length < 4) return

  let cmd = array[2], id = array[3]

  if(Cmds[cmd]) Cmds[cmd](id, value)
};
