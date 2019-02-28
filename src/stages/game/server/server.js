import {Events} from 'monsterr'
import {Logger} from '../../../database/logger'
import config from './../config/config.json'
import score from './../config/score'

let numberOfGames
let colonies = []
let gameloopRef
let startTime
let chatEvents = []

export default {
  commands: {
    'adminReady': (server) => {
      server.send('eventsSoFar', Logger.getEvents().map(event => event.data)).toAdmin()

      let games = [...new Set(colonies.map(colony => colony.game))]
      let gamenetworkdata = games.map(gameNo => colonies.filter(colony => colony.game === gameNo).map(colony => colony.id))
      server.send('gamenetwork', gamenetworkdata).toAdmin()
    },
    'endGame': (server) => {
      tickcount = config.roundLengthInSeconds
    }
  },
  events: {
    'mouseover-colony': (server, clientId, target) => {
      let senderColony = colonies.find(colony => colony.id === clientId)
      let targetColony = colonies.find(colony => senderColony.game === colony.game && colony.name === target)
      Logger.logMouseOverColony(server, senderColony.game, senderColony.name, clientId, targetColony.id)
    },
    'trade': (server, clientId, transfer) => {
      server.log('client ' + clientId + ' transfer: ' + JSON.stringify(transfer))
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

      let receiverId = colonies.find(colony => colony.game === sendingColony.game && colony.name === transfer.colony).id
      Logger.logTrade(server, clientId, receiverId, transfer.material, transferedAmount)

      // add amount to receivers inventory when the trade is complete
      setTimeout(() => {
        let amount = colonies
          .find(colony => colony.game === sendingColony.game && colony.name === transfer.colony)
          .inventory
          .find(material => material.name === transfer.material)
          .amount
        colonies
          .find(colony => colony.game === sendingColony.game && colony.name === transfer.colony)
          .inventory
          .find(material => material.name === transfer.material)
          .amount = Math.floor(amount) + Math.floor(transferedAmount) // it congatinate + as strings

        server.send('trade', {
          sender: colonies.find(colony => colony.id === clientId).name,
          receiver: transfer.colony,
          amount: transferedAmount,
          material: transfer.material
        }).toClients(colonies.filter(colony => colony.game === sendingColony.game).map(colony => colony.id))
        sendColoniesInventories(server)
      }, config.trade_delay)
    },
    'chat': (server, clientId, data) => {
      data.clientId = clientId
      chatEvents.push(data)
      server.log('client ' + clientId + ' (' + data.sender + ') sent message ' + data.message + ' to ' + data.target)
      let colony = colonies.find(colony => colony.id === clientId)
      // data.sender = colony.name
      let target = colonies.find(col => col.game === colony.game && col.name === data.target)
      if (!target) {
        server.send('chat', data).toClients(colonies.filter(col => col.game === colony.game).map(col => col.id))
      } else {
        server.send('chat', data).toClients([clientId, target.id])
      }
      Logger.logChat(server, colony.game, colony.name, clientId, target ? target.id : 'all', data.message)
    },
    'produce': (server, clientId, production) => {
      server.log('client started production: ' + clientId + ' data: ' + JSON.stringify(production))
      let colony = colonies.find(colony => colony.id === clientId)
      let specilisation = colony.specilisations[production.index]
      let inputName = specilisation.input
      let outputName = specilisation.output
      let gain = specilisation.gain
      let delay = specilisation.production_delay

      // substract input materials and inform the colony
      colony.inventory.find(material => material.name === inputName).amount -= production.amount
      sendColoniesInventories(server)

      Logger.logProduction(server, colony.game, colony.name, clientId, production.index, production.amount)

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
      server.log('client reported ready: ' + clientId)
      let reportingColony = colonies.find(colony => colony.id === clientId)
      if (!reportingColony) {
        console.log('unknown client connected: ' + clientId)
        Logger.logEvent(server, 'unknown client connected: ' + clientId)
        server.send('not assigned a colony').toClient(clientId)
        return
      }
      reportingColony.ready = true

      // if the game is running, the player is reconnecting and just needs the data
      if (gameloopRef) {
        sendSetupData(server, reportingColony)
        // else, if all participants are ready, start the game
      } else if (colonies.every(colony => colony.ready)) {
        startTime = Date.now()
        colonies.forEach(colony => sendSetupData(server, colony))

        gameloopRef = setInterval(() => gameloop(server), 1000)
      }
    },
    [Events.CLIENT_RECONNECTED]: (server, clientId) => {
      server.log('client reconnect: ' + clientId)
      // when a client reconnects, wait for about 1 second to let it rebuild
      // the page and then send it the correct stage and data
      setTimeout(() => {
        let stageNo = server.getCurrentStage().number
        server.send(Events.START_STAGE, stageNo).toClient(clientId)
      }, 1000)
    }
  },
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE', server.getCurrentStage())

    numberOfGames = Math.floor(server.getPlayers().length / config.players.length) // ignores leftover participants

    // randomize the order of the players
    let networkPlayers = config.shuffleParticipants
      ? server.getPlayers()
        .map((a) => ({sort: Math.random(), value: a}))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value)
      : server.getPlayers()

    // create a colony to each player
    for (let i = 0; i < networkPlayers.length; i++) {
      let colony = JSON.parse(JSON.stringify(config.players[i % config.players.length]))
      colony.id = networkPlayers[i]
      colony.ready = false
      colony.game = Math.floor(i / config.players.length)
      colonies.push(colony)
    }

    let games = [...new Set(colonies.map(colony => colony.game))]
    let log = games.map(gameNo => '"game ' + gameNo + ': [' + colonies.filter(colony => colony.game === gameNo).map(colony => '(' + colony.id + ', ' + colony.name + ')').join() + ']').join() + '"'
    Logger.logEvent(server, log)

    let gamenetworkdata = games.map(gameNo => colonies.filter(colony => colony.game === gameNo).map(colony => colony.id))
    server.send('gamenetwork', gamenetworkdata).toAdmin()

  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
  },
  options: {}
}

let sendSetupData = (server, receiver) => {
  // only send what is needed
  let simplifiedColonies = []
  colonies.filter(colony => colony.game === receiver.game).forEach(colony => {
    let simplifiedColony = {
      name: colony.name
    }
    // if (config.tooltip.includes('inventories')) {
    simplifiedColony.inventory = colony.inventory
    // }
    if (config.tooltip.includes('specilisations')) {
      simplifiedColony.specilisations = colony.specilisations
    }
    simplifiedColonies.push(simplifiedColony)
  })

  let data = {
    materials: config.materials,
    chat: config.chat,
    allowDirectMessages: config.allowDirectMessages,
    timeLeft: config.roundLengthInSeconds - Math.floor((Date.now() - startTime) / 1000),
    soundVolume: config.soundVolume,
    inventoryBonusLimit: config.inventoryBonusLimit,
    inventoryCriticalLimit: config.inventoryCriticalLimit,
    showInventoryInTooltip: config.tooltip.includes('inventories'),
    showScoreInTooltip: config.tooltip.includes('score'),
    yourName: receiver.name,
    yourSpecilisations: receiver.specilisations,
    yourStartingInventory: config.players.find(player => player.name === receiver.name).inventory,
    colonies: simplifiedColonies
  }
  if (chatEvents.length > 0) { // handle reconnect
    data.chatEvents = chatEvents.filter(event => colonies.find(col => col.id === event.clientId).game === receiver.game && (
      event.target === 'all' ||
      event.sender === receiver.name ||
      event.target === receiver.name
    ))
  }
  server.send('setup', data).toClient(receiver.id)
}

let tickcount = 0
let gameloop = (server) => {
  // check if the game is over
  if (tickcount >= config.roundLengthInSeconds) {
    clearInterval(gameloopRef)
    // simple calculation of points, 10 points for being alive and 2 points for every material over 50%
    let status = colonies.map(colony => {
      let points = score.calculateScore(colony, colonies.filter(col => col.game === colony.game))
      return colony.name + '(' + colony.id + ')\t' + points + ' points'
    })
    console.log('game over\n' + status.join('\n'))
    Logger.logEvent(server, 'game over [' + status.join() + ']')

    for (let i = 0; i < numberOfGames; i++) {
      let coloniesInGame = colonies.filter(colony => colony.game === i)
      let status = coloniesInGame.map(colony => {
        let points = score.calculateScore(colony, colonies.filter(col => col.game === colony.game))
        return colony.name + '\t' + points
      })
      server.send('gameover', status.join('\n')).toClients(coloniesInGame.map(colony => colony.id))
    }

    return
  }
  // update all colonies inventory
  colonies.forEach(colony => {
    config.materials.forEach(material => {
      if (!colony.dead) { // if a colony have 0 materials left, it is dead and should not be updated
        if (colony.inventory.find(colmat => material.name === colmat.name).amount - material.depletion_rate <= 0) {
          killColony(server, colony, material.name)
        } else {
          colony.inventory.find(colmat => material.name === colmat.name).amount -= material.depletion_rate
        }
      }
    })
  })

  tickcount++
  // every 100th second, set the clients inventory, it might have drifted
  if (tickcount % 100 === 0) {
    sendColoniesInventories(server)
    colonies.forEach(colony => {
      Logger.logInventory(server, colony.game, colony.name, colony.id, colony.inventory)
    })
  }
}

// kill a given colony
let killColony = (server, colony, materialName) => {
  colony.dead = true
  colony.inventory.find(row => materialName === row.name).amount = 0
  server.send('colonyDied', colony.name).toClients(colonies.filter(col => col.game === colony.game).map(colony => colony.id))
  Logger.logEvent(server, colony.id + ' has died')
}

// send inventory to all colonies
let sendColoniesInventories = (server) => {
  // depending on how the stage is configured, it should or should not send the other colonies inventory
  for (let i = 0; i < numberOfGames; i++) {
    let inventories = []
    colonies.filter(colony => colony.game === i).forEach(colony =>
      inventories.push({
        name: colony.name,
        inventory: colony.inventory
      })
    )
    server.send('inventories', inventories).toClients(colonies.filter(colony => colony.game === i).map(colony => colony.id))
  }
}
