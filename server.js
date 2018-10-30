import createServer, { Network } from 'monsterr'
import stage1 from './src/stages/game/server/server'

const stages = [stage1]

let events = {}
let commands = {}

const monsterr = createServer({
  network: Network.pairs(8),
  events,
  commands,
  stages,
  options: {
    clientPassword: undefined,  // can specify client password
    adminPassword: 'sEcr3t'     // and admin password
  }
})

monsterr.run()
