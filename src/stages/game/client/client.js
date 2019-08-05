import html from './clientDA.html'
import './client.css'
import {View} from './view.js'
import {Model} from './model.js'

let gameloopRef
let expectedEndTime

let commands = {
  finish (client) {
    client.stageFinished() // <== this is how a client reports finished
    return false // <== false tells client not to pass command on to server
  }
}

let events = {
  'chat': (client, data) => {
    View.addChatMessage(data)
  },
  'gameover': (client, status) => {
    Model.getColony().dead = true
    View.gameover(status)
    clearInterval(gameloopRef)
  },
  'trade': (client, transfer) => {
    View.trade(transfer)
  },
  'inventories': (client, inventories) => {
    // an update from the server to syncronize its inventory with the clients
    // set my inventory for the intenvoryView
    Model.getColony().inventory = inventories.find(colony => colony.name === Model.getColony().name).inventory
    View.updateInventory()
    // set other colonies inventory for the map if it is in the payload
    inventories.filter(colony => colony.name !== Model.getColony().name).forEach(colony => {
      Model.getOtherColonies().find(otherColony => otherColony.name === colony.name).inventory = colony.inventory
    })
  },
  'colonyDied': (client, colonyName) => {
    if (Model.getColony().name === colonyName) {
      Model.getColony().dead = true
    } else {
      Model.getOtherColonies().find(colony => colony.name === colonyName).dead = true
    }
    View.killColony(colonyName)
  },
  'setup': (client, data) => {
    Model.setup(data)
    View.setup(client, data)

    // start client-side gameloop
    gameloopRef = setInterval(gameloop, 1000)
  }
}

export default {
  html,
  commands: commands,
  events: events,
  setup: (client) => {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = './../../../assets/favicon.ico'
    document.getElementsByTagName('head')[0].appendChild(link)

    // when the client is ready to start the game, tell the server
    client.send('ready')
  },
  teardown (client) {
    console.log('closing stage')
    $('#gameoverWindow').modal('hide')
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
    clearInterval(gameloopRef)
  },
  options: {
    htmlContainerHeight: 1,
    hideChat: true
  }
}

let gameloop = () => {
  // update inventory depletion
  Model.getMaterials().forEach(material => {
    if (!Model.getColony().dead) Model.getColony().inventory.find(inventoryMaterial => material.name === inventoryMaterial.name).amount -= material.depletion_rate
    Model.getOtherColonies().forEach(colony => {
      if (!colony.dead) colony.inventory.find(inventoryMaterial => material.name === inventoryMaterial.name).amount -= material.depletion_rate
    })
  })
  View.updateInventory()
  View.updateTooltip()
  View.updateTimeLeft()
  View.updateScore()
}
