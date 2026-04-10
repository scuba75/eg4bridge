'use strict'

let battery = require('./battery.json')
let grid = require('./grid.json')
let load = require('./load.json')
let pv = require('./pv.json')
let schedule = require('./schedule.json')
let status = require('./status.json')

module.exports = { ...battery, ...grid, ...load, ...pv, ...schedule, ...status }
