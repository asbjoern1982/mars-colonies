import createServer, { Network, Events } from 'monsterr'
import game from './src/stages/game/server/server'
import {DatabaseHandler} from './src/database/DatabaseHandler'
import config from './src/stages/game/config/round1.json'
import {spawn} from 'child_process'

const stages = [game]
let numberOfPlayers = config.players.length
let connectedPlayers = 0
console.log('waiting for ' + numberOfPlayers + ' players')

let events = {
  [Events.CLIENT_CONNECTED] (server, clientId) {
    connectedPlayers++
    if (connectedPlayers >= numberOfPlayers) {
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

for (let i = 0; i < config.players.length - 1; i++) {
  console.log('spawning bot #' + i)
  spawn('node', ['./src/bot.js'])
}
