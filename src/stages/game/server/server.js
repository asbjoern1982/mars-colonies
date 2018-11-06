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
    'trade': (server, clientId, transfer) => {
      // remove amount from senders inventory
      colonies
        .find(colony => colony.id === clientId)
        .inventory
        .find(material => material.name === transfer.material)
        .amount -= transfer.amount

      // add amount to receivers inventory
      let amount = colonies
        .find(colony => colony.name === transfer.colony)
        .inventory
        .find(material => material.name === transfer.material)
        .amount
        colonies
        .find(colony => colony.name === transfer.colony)
        .inventory
        .find(material => material.name === transfer.material)
        .amount = Math.floor(amount) + Math.floor(transfer.amount) // it congatinate + as strings

      server.send('trade', {
        sender: colonies.find(colony => colony.id === clientId).name,
        receiver: transfer.colony,
        amount: transfer.amount
      }).toAll()
      sendColoniesInventories(server)
    },
    'chat': (server, clientId, message) => {
      let name = colonies.find(colony => colony.id === clientId).name
      server.send('chat',  name + '>' + message).toAll()
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
        colonies.forEach(colony => {
          let data = {
            colonyName: colony.name,
            specilisations: colony.specilisations,
            otherColonyNames: colonies
              .filter(col => col.id !== colony.id)
              .map(col => col.name),
            materials: config.materials
          }
          server.send('setup', data).toClient(colony.id)
        })

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
  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
  },
  options: {}
}

let tickcount = 0
let gameloop = (server) => {
  // gameloop
  // console.log(JSON.stringify(colonies))
  colonies.forEach(colony => {
    config.materials.forEach(material => {
      colony.inventory.find(colmat => material.name === colmat.name).amount -= material.depletion_rate
    })
  })

  tickcount++
  if (tickcount % 100 === 0) { // every 100th second, set the clients inventory, it might have drifted
    sendColoniesInventories(server)
  }
}

let sendColoniesInventories = (server) => {
  colonies.forEach(colony => server.send('inventory', colony.inventory).toClient(colony.id))
}
