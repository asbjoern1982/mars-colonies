import createClient from 'monsterr'
import vis from 'vis'
import {LatencyModule} from './src/modules/LatencyModule'
import {NetworkModule} from './src/modules/NetworkModule'
import {CPUModule} from './src/modules/CPUModule'
import html from './src/admin/admin-client.html'
import './src/admin/admin-client.css'

let options = {
  canvasBackgroundColor: 'red',
  htmlContainerHeight: 1,
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
  'resPay': (admin, data) => {
    let fileName = 'mars-colonies_payment_' + Date.now() + '.csv'
    let url = window.URL.createObjectURL(new Blob([data], {type: 'text/csv'}))
    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)
  },
  'resZIP': (admin, filename) => {
    console.log(filename)

    $('#downloadZip').prop('href', filename)
    $('#zipWindow').modal('show')
  },
  'logged': (admin, data) => {
    admin.getChat().append(data)
  },
  'downloadReady': (admin, sender) => {
    $('#downloadAllCSV').mouseup(e => {
      //admin.sendCommand('reqCSV')
      //admin.sendCommand('reqPay')
      admin.sendCommand('reqZIP')
      $('#downloadAllWindow').modal('hide')
    })

    $('#downloadAllWindow').modal('show')
  },
  'eventsSoFar': (admin, events) => {
    events.forEach(event => admin.getChat().append(event))
  },
  'gamenetwork' : (admin, data) => {
    console.log(data)

    let nodes = []
    let edges = []

    data.forEach(game => {
      game.forEach(from => {
        game.forEach(to => {
          if (from !== to && !edges.some(edge => edge.from === to && edge.to === from)) edges.push({
            from: from,
            to: to
          })
        })
      })
    })

    data.forEach(game => {
      game.forEach(player => {
        nodes.push({
          id: player,
          label: player,
          borderWidth: 3
        })
      })
    })
    console.log(nodes);
    console.log(edges);

    let container = document.getElementById('gamenetworkgraph') // cannot use jquery here
    let graphdata = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges)
    }
    let options = {}
    let ng = new vis.Network(container, graphdata, options)
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

$('#buttonReset').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reset')
})

$('#buttonDownloadJSON').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqJSON')
})

$('#buttonDownloadCSV').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqCSV')
})

$('#buttonDownloadPay').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqPay')
})

$('#buttonDownloadZip').mouseup(e => {
  e.preventDefault()
  admin.sendCommand('reqZIP')
})

$('#buttonEnable').change(() => {
  $('#buttonStart').prop('disabled', !$('#buttonEnable').prop('checked'))
  $('#buttonNext').prop('disabled', !$('#buttonEnable').prop('checked'))
  $('#buttonEnd').prop('disabled', !$('#buttonEnable').prop('checked'))
  $('#buttonReset').prop('disabled', !$('#buttonEnable').prop('checked'))
});

admin.sendCommand('adminReady')

let link = document.querySelector("link[rel*='icon']") || document.createElement('link')
link.type = 'image/x-icon'
link.rel = 'shortcut icon'
link.href = './../assets/favicon.ico'
document.getElementsByTagName('head')[0].appendChild(link)
