/* very basic admin client, the only addition to this class is the two download buttons */
import createClient from 'monsterr'
import {LatencyModule} from './src/modules/LatencyModule'
import {NetworkModule} from './src/modules/NetworkModule'
import html from './src/admin/admin-client.html'
import './src/admin/admin-client.css'

let options = {
  canvasBackgroundColor: 'red',
  htmlContainerHeight: 0.5,
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
  }
}
let commands = {}

LatencyModule.addAdminClientEvents(events)
NetworkModule.addAdminClientEvents(events)

const admin = createClient({
  events,
  commands,
  options
})

LatencyModule.setupClient(admin)
NetworkModule.setupClient(admin)

$('#buttonStart').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('start')
})

$('#buttonNext').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('next')
})

$('#buttonDownloadJSON').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqJSON')
})

$('#buttonDownloadCSV').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqCSV')
})
