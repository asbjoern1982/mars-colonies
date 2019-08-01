import {Logger} from '../../../database/logger'
import {Events} from 'monsterr'

let clients
let nextStageTimeout

export default {
  commands: {
    'endGame': (server) => {
      console.log('Admin forced end stage')
      finishStage(server)
    }
  },
  events: {
    'ready': (server, clientId) => {
      server.log('client reported ready: ' + clientId)
      server.send('status', clients).toClient(clientId)
    },
    'status': (server, clientId, status) => {
      clients.find(client => client.id === clientId).ready = status

      if (clients.every(client => client.ready)) {
        let delay = 5000
        server.send('allReady', delay).toAll()
        nextStageTimeout = setTimeout(() => {
          server.nextStage()
        }, delay)
      } else if (nextStageTimeout){ // cancel if they change their minds
        clearTimeout(nextStageTimeout)
        nextStageTimeout = undefined
      }

      server.send('status', clients).toAll()
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
    nextStageTimeout = undefined
    clients = server.getPlayers().map(id => {
      return {
        id: id,
        ready: false
      }
    })
  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
  },
  options: {}
}
