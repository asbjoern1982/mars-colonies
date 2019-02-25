import vis from 'vis'

/* what to do to use this NetworkModule
 * 1) download the vis.js module for npm: npm install vis
 * 2) for /server.js add the following lines:
 *    a) in the top: import {NetworkModule} from './src/modules/NetworkModule'
 *    b) move network out of createServer and declare it as a local variable:
         let network = Network.pairs(8)
      c) after that: NetworkModule.addServerCommands(commands, network)
 * 3) for /admin-client.js add the following lines
 *    a) in the top: import {NetworkModule} from './src/modules/NetworkModule'
 *    b) between events is declared and before the server is created: NetworkModule.addAdminClientEvents(events)
 *    c) after the admin-client is created: NetworkModule.setupClient(admin)
 */

let createNetworkModule = () => {
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

  let networkgraph
  let msgName = 'NetworkModuleUpdate'

  let addHTML = (admin) => {
    // inject the html in the page
    let htmlGraph = '<div class="col-lg-6 col-xl-4" style="border: 1px solid lightgray; height: 300px;"><div id="networkgraphtitle">Network Graph</div><div id="networkgraph" style="height: 270px;"></div></div>'
    if ($('#graphs').length) {
      $('#graphs').append(htmlGraph)
    } else {
      $('#admin').append('<div class="container"><div class="row" id="graphs">' + htmlGraph + '</div></div>')
    }
  }

  let createNetworkGraph = (admin) => {
    let nodes = new vis.DataSet([])
    let edges = new vis.DataSet([])

    // create a network
    let container = document.getElementById('networkgraph')
    let data = {
      nodes: nodes,
      edges: edges
    }
    let options = {}
    return new vis.Network(container, data, options)
  }

  let createTimer = (admin) => {
    // update network graph
    admin.sendCommand(msgName)
    setInterval(() => admin.sendCommand(msgName), 5000)
  }

  let setupClient = (admin) => {
    addHTML(admin)
    networkgraph = createNetworkGraph(admin)
    createTimer(admin)
  }

  let addAdminClientEvents = (events) => {
    events[msgName] = (admin, networkdata) => {
      let nodes = networkdata[0]
      let edges = networkdata[1]
      networkgraph.setData({nodes: nodes, edges: edges})
    }
  }

  let addServerCommands = (commands, network) => {
    commands[msgName] = (server) => {
      let players = network.getPlayers()
      let nodes = []
      let colorCount = 0
      for (let player in players) {
        let color = colorCount < colors.length ? colors[colorCount] : 'rgb(0, 0, 0)'
        colorCount++
        nodes.push({id: players[player], label: players[player], borderWidth: 3, color: {border: color, background: '#eee'}})
      }

      let edges = []
      for (let player in players) {
        let neighbours = network.getNeighbours(players[player])
        for (let neighbour in neighbours) {
          // check if the edge exist in edges, if not, add it
          // ps: asumes a non-directed graph
          let edgeExist = false
          for (let edge in edges) {
            if (edges[edge].from === neighbours[neighbour] &&
              edges[edge].to === players[player]) {
              edgeExist = true
            }
          }
          if (!edgeExist) {
            edges.push({from: players[player], to: neighbours[neighbour], color: {color: 'black'}})
          }
        }
      }
      let networkdata = [nodes, edges]
      server.send(msgName, networkdata).toAdmin()
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

export const NetworkModule = createNetworkModule()
