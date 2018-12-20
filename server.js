import createServer, { Network, Events } from 'monsterr'
import game from './src/stages/game/server/server'
import {DatabaseHandler} from './src/database/DatabaseHandler'
import config from './src/stages/game/config/config.json'
import {spawn} from 'child_process'
const stages = [game]

let connectedPlayers = 0
console.log('waiting for ' + config.participants + ' players')

let events = {
  // when all client have connected, push the server into the first stage
  [Events.CLIENT_CONNECTED] (server, clientId) {
    connectedPlayers++
    if (connectedPlayers >= config.participants) {
      server.start()
    }
  }
}
// handle commands from the admin client
let commands = {
  'reqJSON': (server, clientId) => {
    let json = DatabaseHandler.exportAsJSON()
    server.send('resJSON', json).toAdmin()
  },
  'reqCSV': (server, clientId) => {
    let csv = DatabaseHandler.exportAsCSV()
    console.log(csv)
    server.send('resCSV', csv).toAdmin()
  }
}

const monsterr = createServer({
  network: Network.clique(config.participants),
  events,
  commands,
  stages,
  options: {
    clientPassword: undefined, // can specify client password
    adminPassword: 'sEcr3t' // and admin password
  }
})

monsterr.run()

// spawn bot-threads, use "config.participants - 1" for debuging with only 1 client
let numberOfBots = 0 // config.participants - 1
for (let i = 0; i < numberOfBots; i++) {
  console.log('spawning bot #' + i)
  spawn('node', ['./src/bot.js'])
}
