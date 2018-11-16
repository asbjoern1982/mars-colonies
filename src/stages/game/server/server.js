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
      let senderInventory = colonies
        .find(colony => colony.id === clientId)
        .inventory
        .find(material => material.name === transfer.material)
      // if the colony tries to transfer more than is in their inventory, just send what is in the inventory
      let transferedAmount = senderInventory.amount - transfer.amount < 0 ? senderInventory.amount : transfer.amount
      senderInventory.amount -= transferedAmount

      // add amount to receivers inventory when the trade is complete
      setTimeout(() => {
        let amount = colonies
          .find(colony => colony.name === transfer.colony)
          .inventory
          .find(material => material.name === transfer.material)
          .amount
        colonies
          .find(colony => colony.name === transfer.colony)
          .inventory
          .find(material => material.name === transfer.material)
          .amount = Math.floor(amount) + Math.floor(transferedAmount) // it congatinate + as strings

        server.send('trade', {
          sender: colonies.find(colony => colony.id === clientId).name,
          receiver: transfer.colony,
          amount: transfer.amount
        }).toAll()
        sendColoniesInventories(server)
      }, config.trade_delay)
    },
    'chat': (server, clientId, message) => {
      let name = colonies.find(colony => colony.id === clientId).name
      server.send('chat', name + '>' + message).toAll()
    },
    'produce': (server, clientId, production) => {
      let colony = colonies.find(colony => colony.id === clientId)
      let inputName = production.material
      let outputName = colony.specilisations.find(specilisation => specilisation.input === inputName).output
      let gain = colony.specilisations.find(specilisation => specilisation.input === inputName).gain
      let delay = colony.specilisations.find(specilisation => specilisation.input === inputName).transform_rate

      // substract input materials and inform the colony
      colony.inventory.find(material => material.name === inputName).amount -= production.amount
      sendColoniesInventories(server)

      // create a timeout that adds the output to the colony and informs the colony
      setTimeout(() => {
        let currentAmount = colony.inventory.find(material => material.name === outputName).amount
        colony.inventory
          .find(material => material.name === outputName)
          .amount = Math.floor(currentAmount) + Math.floor(production.amount * gain) // it congatinate + as strings
        sendColoniesInventories(server)
      }, delay * 1000)
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
        // only send what is needed
        let simplifiedColonies = []
        colonies.forEach(otherColony => simplifiedColonies.push({
          name: otherColony.name,
          inventory: otherColony.inventory
        }))
        colonies.forEach(colony => {
          let data = {
            materials: config.materials,
            yourName: colony.name,
            yourSpecilisations: colony.specilisations,
            colonies: simplifiedColonies
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
  if (config.information === 'inventories') {
    let inventories = []
    colonies.forEach(colony =>
      inventories.push({
        name: colony.name,
        id: colony.id,
        inventory: colony.inventory
      })
    )
    server.send('inventories', inventories).toAll()
  } else if (config.information === 'none') {
    colonies.forEach(colony => {
      let inventories = [{
        name: colony.name,
        inventory: colony.inventory
      }]
      server.send('inventories', inventories).toClient(colony.id)
    })
  }
}
