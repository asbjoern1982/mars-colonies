import createServer, { Network, Events } from 'monsterr'
import game from './src/stages/game/server/server'
import {DatabaseHandler} from './src/database/DatabaseHandler'
// import config from './src/stages/game/config/round1.json'

const stages = [game]
let numberOfPlayers = 2
let connectedPlayers = 0

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
  network: Network.pairs(8),
  events,
  commands,
  stages,
  options: {
    clientPassword: undefined, // can specify client password
    adminPassword: 'sEcr3t' // and admin password
  }
})

monsterr.run()
