import createServer, { Network } from 'monsterr'
import game from './src/stages/game/server/server'
import {DatabaseHandler} from './src/database/DatabaseHandler'

const stages = [game]

let events = {}
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
