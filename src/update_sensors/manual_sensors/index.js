import batteryAcCharged from './battery_ac_charged.js'
import loadShedding from './load_shedding.js'
import peakHours from './peak_hours.js'
import summerPeakHours from './summer_peak_hours.js'
import bridgeConnected from './bridge_connected.js'

export default async function(){
  await batteryAcCharged()
  await bridgeConnected()
  await loadShedding()
  await peakHours()
  await summerPeakHours()
}
