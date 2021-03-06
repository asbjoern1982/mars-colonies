import createServer, { Network, Events } from 'monsterr'
import {Logger} from './src/database/logger'
import {PaymentHandler} from './src/database/PaymentHandler'
import {LatencyModule} from './src/modules/LatencyModule'
import {NetworkModule} from './src/modules/NetworkModule'
import {CPUModule} from './src/modules/CPUModule'
import {spawn} from 'child_process'
import serverStages from './src/serverStages'

const stages = serverStages.stages

let events = {
  // when all client have connected, push the server into the first stage
  [Events.CLIENT_CONNECTED] (server, clientId) {
    if (server.getPlayers().length >= serverStages.participants) {
      console.log('everyone connected, starting first stage')
      Logger.logEvent(server, -1, 'everyone connected, starting first stage (' + server.getPlayers().join() + ')')
      server.start()
    }
  },
  'ping': (server, clientId) => {
    // disconnect detection
    server.send('pong').toClient(clientId)
  }
}
// handle commands from the admin client
let commands = {
  'reqJSON': (server, clientId) => {
    let json = Logger.exportAsJSON()
    server.send('resJSON', json).toAdmin()
  },
  'reqCSV': (server, clientId) => {
    let csv = Logger.exportAsCSV()
    server.send('resCSV', csv).toAdmin()
  },
  'reqPay': (server, clientId) => {
    PaymentHandler.exportCSV(data => {
      server.send('resPay', data).toAdmin()
    })
  },
  'reqZIP': (server, clientId) => {
    Logger.exportSavedAsZip(server)
  }
}

LatencyModule.addServerCommands(commands)
let network = Network.clique(serverStages.participants)
NetworkModule.addServerCommands(commands, network)
CPUModule.addServerEvents(events)

let options = {
  clientPassword: undefined, // can specify client password
  adminPassword: 'sEcr3t' // and admin password
}
if (process.argv.includes('serv')) {
  options.port = 8080
}

const monsterr = createServer({
  network: network,
  events,
  commands,
  stages,
  options: options
})

monsterr.run()
console.log('waiting for ' + serverStages.participants + ' players')

if (process.argv.includes('bots')) {
  let spawninfo = ['./src/bot.js']
  if (process.argv.includes('serv')) spawninfo.push('serv')
  // spawn bot-threads, use "config.participants - 1" for debuging with only 1 client
  let numberOfBots = serverStages.participants - 1
  for (let i = 0; i < numberOfBots; i++) {
    console.log('spawning bot #' + i)
    spawn('node', spawninfo)
  }
}
