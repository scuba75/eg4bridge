'use strict'
const log = require('./logger')
const express = require('express')

const { dataList } = require('./dataList')

const PORT = process.env.PORT || 3000

const app = express()

const server = app.listen(PORT, ()=>{
  log.info(`eg4bridge is listening on ${server.address().port}`)
})

app.get('/', (req, res)=>{
  res.json(dataList)
})
