import Chart from 'chart.js'

let createCPUModule = () => {
  const delay = 500 // ms
  let bufferCPUModule = []
  const colors = [
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
  const msgName = 'CPUModuleUpdate'

  let addHTML = (admin) => {
    // inject the html in the page
    let htmlGraph = '<div class="col-lg-6 col-xl-4" style="border: 1px solid lightgray; height: 300px; padding-bottom: 30px;"><div id="cpugraphtitle">CPU Graph</div><canvas id="cpugraph"></canvas></div>'
    if ($('#graphs').length) {
      $('#graphs').append(htmlGraph)
    } else {
      $('#admin').append('<div class="container"><div class="row" id="graphs" style="background-color: white;">' + htmlGraph + '</div></div>')
    }
  }

  let createCPUGraph = (admin) => {
    // build latency graph
    // known problems:
    // - when a client disconnects it is still in the array
    // - the scale is sometimes off, either too small to fit the data or way too large, might have been a higher point not that long canvasBackgroundColor
    // - animation is not flued, it should move from right to left
    // - possible a save-button to save a picture of the graph to troubleshoot later, either case, a timestamp would be nice
    let ctx = $('#cpugraph')
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

  let setupClient = (client) => {
    // check cpu load every 5 second
    setInterval(() => {
      let beginning = Date.now()
      setTimeout(() => {
        let now = Date.now()
        let dif = now - beginning - delay
        client.send(msgName, dif)
      }, delay)
    }, 5000)
  }

  let setupAdminClient = (admin) => {
    addHTML(admin)
    chart = createCPUGraph(admin)
    setInterval(() => {
      let colorCount = 0
      let datasets = Object.keys(bufferCPUModule).map(key => {
        let color = colorCount < colors.length ? colors[colorCount] : 'rgb(0, 0, 0)'
        colorCount++
        return {
          label: key,
          borderColor: color,
          data: bufferCPUModule[key].slice().reverse()
        }
      })

      chart.data.datasets = datasets
      chart.update()
    }, 5000)
  }

  let addAdminClientEvents = (events) => {
    events[msgName] = (admin, payload) => {
      if (bufferCPUModule[payload.clientId]) {
        bufferCPUModule[payload.clientId].push(payload.dif)
        if (bufferCPUModule.length > 12) bufferCPUModule.shift() // remove old data
      } else {
        bufferCPUModule[payload.clientId] = [payload.dif]
      }
    }
  }

  let addServerEvents = (events) => {
    events[msgName] = (server, clientId, dif) => {
      server.send(msgName, {clientId: clientId, dif: dif}).toAdmin()
      server.log({clientId: clientId, dif: dif}, 'cpu')
    }
  }

  return {
    // run in setup
    setupClient,
    setupAdminClient,
    // run before creating the client
    addAdminClientEvents,
    // run before creating the server
    addServerEvents
  }
}

export const CPUModule = createCPUModule()
