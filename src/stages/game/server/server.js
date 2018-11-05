import {DatabaseHandler} from '../../../database/DatabaseHandler'
import firstRound from './../config/round1.json'

let config = firstRound
let colonies = config.players

export default {
  commands: {},
  events: {
    'some_event': (server, clientId, data) => {
      DatabaseHandler.logEvent(clientId, 'data')
    },
    'ready': (server, clientId) => {
      colonies.find(colony => colony.id === clientId).ready = true

      let allReady = true
      colonies.forEach(colony => {
        if (!colony.ready) {
          allReady = false
        }
      })
      if (allReady) {
        console.log('All clients have reported ready, starting game')
        sendColoniesInventories(server)
        setInterval(() => gameloop(server), 1000)
      }
    }
  },
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE', server.getCurrentStage())

    let networkPlayers = server.getPlayers().map((a) => ({sort: Math.random(), value: a}))
      .sort((a, b) => a.sort - b.sort)
      .map((a) => a.value)
    for (let i = 0; i < networkPlayers.length; i++) {
      colonies[i].id = networkPlayers[i]
      colonies[i].ready = false
    }
    console.log(JSON.stringify(colonies))
  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
  },
  options: {}
}

let tickcount = 0
let gameloop = (server) => {
  // gameloop
  console.log(JSON.stringify(colonies))
  colonies.forEach(colony => {
    config.materials.forEach(material => {
      colony.inventory.find(colmat => material.name === colmat.name).amount -= material.depletion_rate
    })
    /* colony.inventory.forEach(material => {
      material += config.materials.find(mat => mat.name === material.name).depletion_rate
    }) */
  })

  tickcount++
  if (tickcount % 100 === 0) { // every 100th second, set the clients inventory, it might have drifted
    sendColoniesInventories(server)
  }
}

let sendColoniesInventories = (server) => {
  colonies.forEach(colony => server.send('inventory', colony.inventory).toClient(colony.id))
}
