import createServer, { Network, Events } from 'monsterr'
import game from './src/stages/game/server/server'
import {DatabaseHandler} from './src/database/DatabaseHandler'
import config from './src/stages/game/config/round1.json'
import {spawn} from 'child_process'
const stages = [game]

// validate config
let names = config.players.map(player => player.name)
let namesSet = [...new Set(names)]
if (names.length !== namesSet.length) {
  names = names.map((item, i) => names.includes(item, i + 1) ? item : '').filter(item => item !== '')
  throw new Error('validation failed, dublicates of names in config-file, dubs: [' + names + ']')
}

let connectedPlayers = 0
console.log('waiting for ' + config.players.length + ' players')

let events = {
  [Events.CLIENT_CONNECTED] (server, clientId) {
    connectedPlayers++
    if (connectedPlayers >= config.players.length) {
      server.start()
    }
  }
}
let commands = {
  'reqJSON': (server, clientId) => {
    let json = DatabaseHandler.exportAsJSON()
    server.send('resJSON', json).toAdmin()
  }
}

const monsterr = createServer({
  network: Network.clique(config.players.length),
  events,
  commands,
  stages,
  options: {
    clientPassword: undefined, // can specify client password
    adminPassword: 'sEcr3t' // and admin password
  }
})

monsterr.run()

// spawn bot-threads
let numberOfBots = config.players.length - 1
for (let i = 0; i < numberOfBots; i++) {
  console.log('spawning bot #' + i)
  spawn('node', ['./src/bot.js'])
}
