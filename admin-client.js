/* very basic admin client, the only addition to this class is the two download buttons */
import createClient from 'monsterr'
import {LatencyModule} from './src/modules/LatencyModule'
import {NetworkModule} from './src/modules/NetworkModule'
import {CPUModule} from './src/modules/CPUModule'
import html from './src/admin/admin-client.html'
import './src/admin/admin-client.css'

let options = {
  canvasBackgroundColor: 'red',
  htmlContainerHeight: 1,
  // HTML is included in options for admin
  html
}

let events = {
  'resJSON': (admin, json) => {
    // to download the data to a file, a Blob is used
    let fileName = 'mars-colonies_' + Date.now() + '.json'
    let data = JSON.stringify(json)
    let url = window.URL.createObjectURL(new Blob([data], {type: 'text/json'}))
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)
  },
  'resCSV': (admin, csv) => {
    let keys = Object.keys(csv)
    let fileending = Date.now() + '.csv'
    keys.forEach(key => {
      let data = csv[key] + '\n'
      let fileName = 'mars-colonies_' + key + '_' + fileending
      let url = window.URL.createObjectURL(new Blob([data], {type: 'text/csv'}))
      var a = document.createElement('a')
      document.body.appendChild(a)
      a.style = 'display: none'
      a.href = url
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(url)
    })
  },
  'logged': (admin, data) => {
    admin.getChat().append(data)
  },
  'eventsSoFar': (admin, events) => {
    events.forEach(event => admin.getChat().append(event))
  }
}
let commands = {}

LatencyModule.addAdminClientEvents(events)
NetworkModule.addAdminClientEvents(events)
CPUModule.addAdminClientEvents(events)

const admin = createClient({
  events,
  commands,
  options
})

LatencyModule.setupClient(admin)
NetworkModule.setupClient(admin)
CPUModule.setupAdminClient(admin)

$('#buttonStart').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('start')
})

$('#buttonNext').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('next')
})

$('#buttonEnd').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('endGame')
})

$('#buttonDownloadJSON').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqJSON')
})

$('#buttonDownloadCSV').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqCSV')
})

admin.sendCommand('sendEventsSoFar')

let link = document.querySelector("link[rel*='icon']") || document.createElement('link')
link.type = 'image/x-icon'
link.rel = 'shortcut icon'
link.href = './../assets/favicon.ico'
document.getElementsByTagName('head')[0].appendChild(link)
