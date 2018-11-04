import {DatabaseHandler} from '../../../database/DatabaseHandler'

let players = {}

export default {
  commands: {},
  events: {
    'some_event': (server, clientId, data) => {
      DatabaseHandler.logEvent(clientId, 'data')
    },
    'ready': (server, clientId) => {
      players[clientId] = true
      let allReady = true
      players.values().forEach(value => {
        if (!value.ready) {
          allReady = false
        }
      })
      if (allReady) {
        setInterval(gameloop, 1000)
      }
    }
  },
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE',
      server.getCurrentStage())

    server.getPlayers().forEach(player => {
      players[player] = {
        ready: false,
        inventory: {
          Palladium: 1000,
          Selenium: 1000
        }
      }
    })
  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE',
      server.getCurrentStage())
  },
  options: {}
}

let gameloop = () => {
  // gameloop
}
