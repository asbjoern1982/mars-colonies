import {DatabaseHandler} from '../../../database/DatabaseHandler'
import firstRound from './../config/round1.json'

let config = firstRound
let colonies = config.players

export default {
  commands: {},
  events: {
    'mouseover-colony': (server, clientId, target) => {
      let targetId = colonies.find(colony => colony.name === target).id
      DatabaseHandler.logMouseOverColony(clientId, targetId)
    },
    'trade': (server, clientId, transfer) => {
      // remove amount from senders inventory
      let sendingColony = colonies.find(colony => colony.id === clientId)
      let senderInventory = sendingColony
        .inventory
        .find(material => material.name === transfer.material)
      // if the colony tries to transfer more than is in their inventory, just send what is in the inventory
      let transferedAmount = senderInventory.amount - transfer.amount < 0 ? senderInventory.amount : transfer.amount
      if (senderInventory.amount - transfer.amount < 0) {
        killColony(server, sendingColony, transfer.material)
      } else {
        senderInventory.amount -= transferedAmount
      }

      let receiverId = colonies.find(colony => colony.name === transfer.colony).id
      DatabaseHandler.logTrade(clientId, receiverId, transfer.material, transferedAmount)

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
      DatabaseHandler.logChat(clientId, message)
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

      DatabaseHandler.logProduction(clientId, inputName, production.amount)

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
        colonies.forEach(otherColony => {
          let simplifiedColony = {
            name: otherColony.name
          }
          if (config.tooltip.includes('inventories')) {
            simplifiedColony.inventory = otherColony.inventory
          }
          if (config.tooltip.includes('specilisations')) {
            simplifiedColony.specilisations = otherColony.specilisations
          }
          simplifiedColonies.push(simplifiedColony)
        })
        colonies.forEach(colony => {
          let data = {
            materials: config.materials,
            chat: config.chat,
            inventoryBonusLimit: config.inventoryBonusLimit,
            inventoryCriticalLimit: config.inventoryCriticalLimit,
            yourName: colony.name,
            yourSpecilisations: colony.specilisations,
            yourStartingInventory: colony.inventory,
            colonies: simplifiedColonies
          }
          server.send('setup', data).toClient(colony.id)
        })

        sendColoniesInventories(server)
        setInterval(() => gameloop(server), 1000)
        DatabaseHandler.logEvent('game started with [' + colonies.map(colony => colony.id).join(',') + ']')
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
      if (!colony.dead) { // if a colony have 0 materials left, it is dead and should not be updated
        if (colony.inventory.find(colmat => material.name === colmat.name).amount - material.depletion_rate <= 0) {
          killColony(server, colony, material)
        } else {
          colony.inventory.find(colmat => material.name === colmat.name).amount -= material.depletion_rate
        }
      }
    })
  })

  tickcount++
  if (tickcount % 100 === 0) { // every 100th second, set the clients inventory, it might have drifted
    sendColoniesInventories(server)
    colonies.forEach(colony => {
      let inventory = []
      colony.inventory.map(row => inventory.push(
        {
          name: row.name,
          amount: row.amount
        }
      ))
      DatabaseHandler.logInventory(colony.id, inventory)
    })
  }
}

let killColony = (server, colony, materialName) => {
  colony.dead = true
  colony.inventory.find(row => materialName === row.name).amount = 0
  server.send('colonyDied', colony.name).toAll()
  DatabaseHandler.logEvent(colony.id + ' has died')
}

let sendColoniesInventories = (server) => {
  if (config.tooltip.includes('inventories')) {
    let inventories = []
    colonies.forEach(colony =>
      inventories.push({
        name: colony.name,
        inventory: colony.inventory
      })
    )
    server.send('inventories', inventories).toAll()
  } else {
    colonies.forEach(colony => {
      let inventories = [{
        name: colony.name,
        inventory: colony.inventory
      }]
      server.send('inventories', inventories).toClient(colony.id)
    })
  }
}
