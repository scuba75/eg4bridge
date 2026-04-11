'use strict'
const log = require('./logger')
const express = require('express')
const cache = require('./sqlite')
const { dataList } = require('./dataList')

const PORT = process.env.PORT || 3000

const app = express()

const server = app.listen(PORT, ()=>{
  log.info(`eg4bridge is listening on ${server.address().port}`)
})

app.get('/data', (req, res)=>{
  if(dataList?.main){
    res.json(dataList)
  }else{
    res.sendStatus(200)
  }

})
app.get('/stats', async(req, res)=>{
  try{
    let data = {}
    data.daily = await cache.all('daily')
    data.minute = await cache.all('minute')
    if(data?.daily && data.minute){
      res.json(data)
    }else{
      res.sendStatus(400)
    }
  }catch(e){
    res.sendStatus(400)
    log.error(e)
  }
})
