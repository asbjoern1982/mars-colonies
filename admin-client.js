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
  }
}
let commands = {}

const admin = createClient({
  events,
  commands,
  options
  // no need to add stages to admin
})

// Button event handlers (if you need more you should probably put them in a separate file and import it here)
$('#admin-button-start').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('start')
})
$('#admin-button-next').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('next')
})
$('#admin-button-reset').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reset')
})
$('#admin-button-download').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqJSON')
})
