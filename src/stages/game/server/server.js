import {Events} from 'monsterr'
import {Logger} from '../../../database/logger'
// import config from './../config/config.json'
// import score from './../config/score'
import {PaymentHandler} from '../../../database/PaymentHandler'
import serverStages from '../../../serverStages'

let config

let numberOfGames // amount of games to run on the same time, ei 6 participants in 2 different games with 3 players each
let colonies // list of all colonies
let gameloopRef // ref to the gameloop
let startTime // time all players reported ready and the gameloop started
let chatEvents // list of all chat messages, saved to be able to send the chat to reconnecting clients

let runningTimeouts // ref to trade and production timeouts so it is possible to stop them if the stage restarts
let eventId = 0 // save eventId so it is possible to see connect start and stop production events in inventory log

let tickcount
let score

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
      Logger.logMouseOverColony(server, eventId++, senderColony.game, senderColony.name, clientId, target, targetColony.id)
    },
    'trade': (server, clientId, transfer) => {
      server.log('client ' + clientId + ' transfer: ' + JSON.stringify(transfer))
      // remove amount from senders inventory
      let sendingColony = colonies.find(colony => colony.id === clientId)

      let eventIdRef = eventId++
      Logger.logInventory(server, eventId++, sendingColony.game, sendingColony.name, sendingColony.id,  'pre-trade start', eventIdRef, sendingColony.inventory)

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

      let receiver = colonies.find(colony => colony.game === sendingColony.game && colony.name === transfer.colony)

      Logger.logTrade(server, eventIdRef, sendingColony.game, sendingColony.name, clientId, receiver.name, receiver.id, transfer.material, transferedAmount)
      sendColoniesInventories(server)
      Logger.logInventory(server, eventId++, sendingColony.game, sendingColony.name, sendingColony.id,  'trade started', eventIdRef, sendingColony.inventory)


      // add amount to receivers inventory when the trade is complete
      let ref = setTimeout(() => {
        Logger.logInventory(server, eventId++, sendingColony.game, sendingColony.name, sendingColony.id,  'pre-trade finish', eventIdRef, sendingColony.inventory)

        let amount = colonies
          .find(colony => colony.game === sendingColony.game && colony.name === transfer.colony)
          .inventory
          .find(material => material.name === transfer.material)
          .amount
        colonies
          .find(colony => colony.game === sendingColony.game && colony.name === transfer.colony)
          .inventory
          .find(material => material.name === transfer.material)
          .amount = parseFloat(amount) + parseFloat(transferedAmount) // it congatinate + as strings

        server.send('trade', {
          sender: colonies.find(colony => colony.id === clientId).name,
          receiver: transfer.colony,
          amount: transferedAmount,
          material: transfer.material
        }).toClients(colonies.filter(colony => colony.game === sendingColony.game).map(colony => colony.id).filter(id => server.getPlayers().includes(id)))
        sendColoniesInventories(server)

        Logger.logInventory(server, eventId++, sendingColony.game, sendingColony.name, sendingColony.id,  'trade finished', eventIdRef, sendingColony.inventory)

        runningTimeouts = runningTimeouts.filter(t => t.ref !== ref) // removes this timeout
      }, config.trade_delay * 1000)
      runningTimeouts.push({colony: receiver, ref: ref})
    },
    'chat': (server, clientId, data) => {
      data.clientId = clientId
      // sanitize message
      data.message = data.message.replace(/[&"<>]/g, (c) => {
        return {
          '&': "&amp;",
          '"': "&quot;",
          '<': "&lt;",
          '>': "&gt;"
        }[c]
      })
      chatEvents.push(data)

      server.log('client ' + clientId + ' (' + data.sender + ') sent message ' + data.message + ' to ' + data.target)
      let colony = colonies.find(colony => colony.id === clientId)
      // data.sender = colony.name
      let target = colonies.find(col => col.game === colony.game && col.name === data.target)
      if (!target) {
        server.send('chat', data).toClients(colonies.filter(col => col.game === colony.game).map(col => col.id).filter(id => server.getPlayers().includes(id)))
      } else {
        server.send('chat', data).toClients([clientId, target.id].filter(id => server.getPlayers().includes(id)))
      }
      Logger.logChat(server, eventId++, colony.game, colony.name, clientId, target ? target.name : 'all', target ? target.id : '', data.message)
    },
    'produce': (server, clientId, production) => {
      server.log('client started production: ' + clientId + ' data: ' + JSON.stringify(production))
      let colony = colonies.find(colony => colony.id === clientId)
      let specialization = colony.specializations[production.index]
      let inputName = specialization.input
      let outputName = specialization.output
      let gain = specialization.gain
      let delay = specialization.production_delay

      let eventIdRef = eventId++
      Logger.logInventory(server, eventId++, colony.game, colony.name, colony.id, 'pre-production start', eventIdRef, colony.inventory)

      // substract input materials and inform the colony
      let inventory = colony.inventory.find(material => material.name === inputName)
      if (inventory.amount < production.amount) {
        // if the amount is larger than what is inventory, just use everything that is left
        production.amount = inventory.amount
      }
      inventory.amount -= production.amount
      sendColoniesInventories(server)

      Logger.logProduction(server, eventIdRef, colony.game, colony.name, clientId, production.index, production.amount, inputName, outputName, gain)
      Logger.logInventory(server, eventId++, colony.game, colony.name, colony.id, 'production started', eventIdRef, colony.inventory)

      // create a timeout that adds the output to the colony and informs the colony
      let ref = setTimeout(() => {
              Logger.logInventory(server, eventId++, colony.game, colony.name, colony.id, 'pre-production finish', eventIdRef, colony.inventory)
        let currentAmount = colony.inventory.find(material => material.name === outputName).amount
        colony.inventory
          .find(material => material.name === outputName)
          .amount = parseFloat(currentAmount) + parseFloat(production.amount * gain) // issue it congatinate + as strings
        sendColoniesInventories(server)
        Logger.logInventory(server, eventId++, colony.game, colony.name, colony.id, 'production finished', eventIdRef, colony.inventory)
        runningTimeouts = runningTimeouts.filter(t => t.ref !== ref) // removes this timeout
      }, delay * 1000)
      runningTimeouts.push({colony: colony, ref: ref})
    },
    'ready': (server, clientId) => {
      server.log('client reported ready: ' + clientId)
      let reportingColony = colonies.find(colony => colony.id === clientId)
      if (!reportingColony) {
        console.log('unknown client connected: ' + clientId)
        Logger.logEvent(server, eventId++, 'unknown client connected: ' + clientId)
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

        tickcount = 0
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
    },
    [Events.CLIENT_DISCONNECTED] (server, clientId) {
      Logger.logEvent(server, eventId++, clientId + ' disconnected')
    },
    [Events.CLIENT_CONNECTED]: (server, clientId) => {
      let avalibleColony = colonies.find(colony => !server.getPlayers().includes(colony.id))
      if (avalibleColony) {
        Logger.logEvent(server, eventId++, 'unknown player (' + clientId + ') connected, replacing ' + avalibleColony.id + ' (' + avalibleColony.name + ') in game ' + avalibleColony.game)
        chatEvents.forEach(event => {
          if (event.clientId === avalibleColony.id) event.clientId = clientId
        })
        avalibleColony.id = clientId
        setTimeout(() => {
          let stageNo = server.getCurrentStage().number
          server.send(Events.START_STAGE, stageNo).toClient(clientId)
        }, 1000)
      } else {
        Logger.logEvent(server, eventId++, 'unknown player (' + clientId + ') connected, no avalible colonies')
      }
    }
  },
  setup: (server) => {
    // reset the game variables
    config = serverStages.configs[server.getCurrentStage().number].config
    score = serverStages.configs[server.getCurrentStage().number].score

    colonies = []
    chatEvents = []
    runningTimeouts = []

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
    let log = games.map(gameNo => 'game ' + gameNo + ': [' + colonies.filter(colony => colony.game === gameNo).map(colony => '(' + colony.id + ', ' + colony.name + ')').join() + ']').join() + ''
    Logger.logEvent(server, eventId++, log)

    let gamenetworkdata = games.map(gameNo => colonies.filter(colony => colony.game === gameNo).map(colony => colony.id))
    server.send('gamenetwork', gamenetworkdata).toAdmin()
  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
    runningTimeouts.forEach(t => clearTimeout(t)) // remove any timeouts
    // TODO: clear gameloop interval?
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
    if (config.tooltip.includes('specializations')) {
      simplifiedColony.specializations = colony.specializations
    }
    simplifiedColonies.push(simplifiedColony)
  })

  let data = {
    stage: server.getCurrentStage().number,
    practiceRun: config.practiceRun,
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
    yourSpecializations: receiver.specializations,
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

let gameloop = (server) => {
  // check if the game is over
  if (tickcount >= config.roundLengthInSeconds) {
    clearInterval(gameloopRef)
    gameloopRef = undefined
    // simple calculation of points, 10 points for being alive and 2 points for every material over 50%
    let status = colonies.map(colony => {
      let points = score.calculateScore(colony, colonies.filter(col => col.game === colony.game), config.inventoryBonusLimit)
      return colony.name + '(' + colony.id + ')\t' + points + ' points'
    })
    console.log('game over\n' + status.join('\n'))
    Logger.logEvent(server, eventId++, 'game over [' + status.join() + ']')

    for (let i = 0; i < numberOfGames; i++) {
      let coloniesInGame = colonies.filter(colony => colony.game === i)
      let status = coloniesInGame.map(colony => {
        let points = score.calculateScore(colony, colonies.filter(col => col.game === colony.game), config.inventoryBonusLimit)
        return colony.name + '\t' + points
      })
      server.send('gameover', status.join('\n')).toClients(coloniesInGame.map(colony => colony.id).filter(id => server.getPlayers().includes(id)))

      // go to next stage after 20 sec
      setTimeout(() => {
        server.nextStage()
      }, 20000)
    }

    if (!config.practiceRun) {
      PaymentHandler.setPayoutAmount(colonies.map(colony => ({
        clientId: colony.id,
        amount: score.calculateScore(colony, colonies.filter(col => col.game === colony.game), config.inventoryBonusLimit)
      })))
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
      Logger.logInventory(server, eventId++, colony.game, colony.name, colony.id, 'sync', '', colony.inventory)
    })
  }
}

// kill a given colony
let killColony = (server, colony, materialName) => {
  colony.dead = true
  colony.inventory.find(row => materialName === row.name).amount = 0 // overwrite amount if gameloop have substracted something
  server.send('colonyDied', colony.name).toClients(colonies.filter(col => col.game === colony.game).map(colony => colony.id).filter(id => server.getPlayers().includes(id)))
  let eventIdRef = eventId++
  Logger.logEvent(server, eventIdRef, colony.id + '(' +colony.name + ') has died')
  Logger.logInventory(server, eventId++, colony.game, colony.name, colony.id, colony.name + ' died', eventIdRef, colony.inventory)

  // clear any timeouts with the colony
  runningTimeouts.filter(t => t.colony.id === colony.id).map(t => t.ref).forEach(ref => clearTimeout(ref))

  // if everyone is dead, end the round
  if (colonies.every(colony => colony.dead)) {
    tickcount = config.roundLengthInSeconds
  }
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
    server.send('inventories', inventories).toClients(colonies.filter(colony => colony.game === i).map(colony => colony.id).filter(id => server.getPlayers().includes(id)))
  }
}
