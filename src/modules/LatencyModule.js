// import Chart from '/assets/Chart.js'
import Chart from 'chart.js'

/* what to do to use this LatencyModule
 * 1) download the chart.js module for npm: npm install chart.js
 * 2) for /server.js add the following lines:
 *    a) in the top: import {LatencyModule} from './src/modules/LatencyModule'
 *    b) between commands is declared and before the server is created: LatencyModule.addServerCommands(commands)
 * 3) for /admin-client.js add the following lines
 *    a) in the top: import {LatencyModule} from './src/modules/LatencyModule'
 *    b) between events is declared and before the server is created: LatencyModule.addAdminClientEvents(events)
 *    c) after the admin-client is created: LatencyModule.setupClient(admin)
 */

let createLatencyModule = () => {
  let colors = [
    'rgb(100, 255, 255)',
    'rgb(255, 255, 100)',
    'rgb(255, 100, 255)',
    'rgb(100, 100, 255)',
    'rgb(255, 100, 100)',
    'rgb(100, 255, 255)',
    'rgb(255, 0, 0)',
    'rgb(0, 255, 0)',
    'rgb(0, 0, 255)',
    'rgb(255, 0, 255)'
  ]
  let chart
  let msgName = 'LatencyModuleUpdate'

  let addHTML = (admin) => {
    // inject the html in the page
    let htmlGraph = '<div class="col-sm" style="border: 1px solid lightgray; height: 300px; width: 300px;"><div id="latencygraphtitle">Latency Graph</div><canvas id="latencygraph"></canvas></div>'
    if ($('#graphs').length) {
      $('#graphs').append(htmlGraph)
    } else {
      $('#admin').append('<div class="container"><div class="row" id="graphs">' + htmlGraph + '</div></div>')
    }
  }

  let createLatencyGraph = (admin) => {
    // build latency graph
    // known problems:
    // - when a client disconnects it is still in the array
    // - the scale is sometimes off, either too small to fit the data or way too large, might have been a higher point not that long canvasBackgroundColor
    // - animation is not flued, it should move from right to left
    // - possible a save-button to save a picture of the graph to troubleshoot later, either case, a timestamp would be nice
    let ctx = $('#latencygraph')
    let chart = new Chart(ctx, {
      type: 'line', // The type of chart we want to create
      data: {
        labels: ['0s', '5s', '10s', '15s', '20s', '25s', '30s', '35s', '40s', '45s', '50s', '55s'],
        datasets: []
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        animation: {
          duration: 0, // faster animations
          easing: 'linear'
        },
        scales: {
          yAxes: [{
            ticks: {
              suggestedMin: 0 // makes the y-axes start at 0
            }
          }]
        }
      } // Configuration options go here
    })
    return chart
  }

  let createTimer = (admin) => {
    // start the listenerloop for updating the graph, note:  there is only
    // new data every 5 seconds, hench the slow timer
    admin.sendCommand(msgName)
    setInterval(() => admin.sendCommand(msgName), 5000)
  }

  let setupClient = (admin) => {
    addHTML(admin)
    chart = createLatencyGraph(admin)
    createTimer(admin)
  }

  let addAdminClientEvents = (events) => {
    events[msgName] = (admin, latencies) => {
      if (!chart) {
        console.log('chart not initialized, please run "setupClient(admin)" before running the adminClient')
        return
      }
      let dataset = []
      let colorCount = 0
      for (let key in latencies) {
        let color = colorCount < colors.length ? colors[colorCount] : 'rgb(0, 0, 0)'
        colorCount++
        dataset.push({
          label: key,
          borderColor: color,
          data: latencies[key].data.reverse()
        })
      }
      // the problem is that the graph is not moving, but each datapoints position is shifted
      /* if (chart.data.datasets.count > 6) {
        chart.data.datasets.pop()
      }
      chart.data.datasets.push(dataset[0]) */
      chart.data.datasets = dataset
      chart.update()
    }
  }

  let addServerCommands = (commands) => {
    commands[msgName] = (server) => {
      server.send(msgName, server.getLatencies()).toAdmin()
    }
  }

  return {
    // run in setup
    setupClient,
    // run before creating the client
    addAdminClientEvents,
    // run before creating the server
    addServerCommands
  }
}

export const LatencyModule = createLatencyModule()
