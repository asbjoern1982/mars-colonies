import html from './client.html'
import './client.css'
import {View} from './view.js'
import {Model} from './model.js'

let gameloopRef

let commands = {
  finish (client) {
    client.stageFinished() // <== this is how a client reports finished
    return false // <== false tells client not to pass command on to server
  }
}

let events = {
  'chat': (client, message) => {
    View.addChatMessage(message)
  },
  'gameover': (client, status) => {
    Model.thisColony().dead = true
    View.gameover(status)
    clearInterval(gameloopRef)
  },
  'trade': (client, transfer) => {
    View.trade(transfer)
  },
  'inventories': (client, inventories) => {
    // an update from the server to syncronize its inventory with the clients
    // set my inventory for the intenvoryView
    Model.thisColony().inventory = inventories.find(colony => colony.name === Model.thisColony().name).inventory
    View.updateInventory()
    // set other colonies inventory for the map if it is in the payload
    inventories.filter(colony => colony.name !== Model.thisColony().name).forEach(colony => {
      Model.otherColonies().find(otherColony => otherColony.name === colony.name).inventory = colony.inventory
    })
  },
  'colonyDied': (client, colonyName) => {
    if (Model.thisColony().name === colonyName) {
      Model.thisColony().dead = true
    } else {
      Model.otherColonies().find(colony => colony.name === colonyName).dead = true
    }
    View.killColony(colonyName)
  },
  'setup': (client, data) => {
    View.setupClient(client)
    Model.setup(data)
    View.setupEvent(client, data)

    // add nodes to the map
    View.setupMap(client)

    // start client-side gameloop
    gameloopRef = setInterval(gameloop, 1000)
  }
}

export default {
  html,
  commands: commands,
  events: events,

  setup: (client) => {

    // when the client is ready to start the game, tell the server
    client.send('ready')
  },
  teardown (client) {},
  options: {
    htmlContainerHeight: 1,
    hideChat: true
  }
}

let gameloop = () => {
  // update inventory depletion
  Model.materials().forEach(material => {
    if (!Model.thisColony().dead) Model.thisColony().inventory.find(inventoryMaterial => material.name === inventoryMaterial.name).amount -= material.depletion_rate
    Model.otherColonies().forEach(colony => {
      if (!colony.dead) colony.inventory.find(inventoryMaterial => material.name === inventoryMaterial.name).amount -= material.depletion_rate
    })
  })
  View.updateInventory()
  View.updateTooltip()
}
