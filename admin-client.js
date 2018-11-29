/* globals $ */
import createClient from 'monsterr'

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
  }
}
let commands = {}

const admin = createClient({
  events,
  commands,
  options
  // no need to add stages to admin
})

$('#buttonDownloadJSON').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqJSON')
})

$('#buttonDownloadCSV').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqCSV')
})
