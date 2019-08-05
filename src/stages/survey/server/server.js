import {Logger} from '../../../database/logger'
import {Events} from 'monsterr'
import serverStages from '../../../serverStages'

let completedSurveys = 0

export default {
  commands: {
    'endGame': (server) => {
      console.log('Admin forced end stage')
      endStage(server)
    }
  },
  events: {
    'ready': (server, clientId) => {
      server.send('ready', serverStages.configs[server.getCurrentStage().number]).toClient(clientId)
    },
    'surveyResult': (server, clientId, data) => {
      Logger.logSurvey(server, clientId, data)
      completedSurveys++
      if (completedSurveys >= server.getPlayers().length) {
        server.send('logged', 'everyone has completed the survey').toAdmin()
        endStage(server)
      }
    },
    [Events.CLIENT_RECONNECTED]: (server, clientId) => {
      server.log('client reconnect: ' + clientId)
      // when a client reconnects, wait for about 1 second to let it rebuild
      // the page and then send it the correct stage and data

      // TODO this lets the participant complete the same survey multiple times if reloading
      setTimeout(() => {
        let stageNo = server.getCurrentStage().number
        server.send(Events.START_STAGE, stageNo).toClient(clientId)
      }, 1000)
    }
  },
  setup: (server) => {
    // console.log('PREPARING SERVER FOR STAGE', server.getCurrentStage())
    Logger.logEvent(server, -1, 'starting post survey stage (' + server.getCurrentStage().number + ')')
    console.log('Starting stage: ' + serverStages.configs[server.getCurrentStage().number].title)
    completedSurveys = 0 // this carries over from previous stages
  },
  teardown: (server) => {
    Logger.saveSurveyCSV(server.getCurrentStage().number)
    // console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
  },
  options: {}
}

let endStage = (server) => {
  // send message to clients and set a timeout
  server.send('everyoneIsReady').toAll()
  setTimeout(() => {
    let moreStages = false // enable continious running of experiment
    if (moreStages) {
      server.nextStage()
    } else {
      console.log('resetting server')
      Logger.logEvent(server, -1, 'server resetting')
      Logger.reset()
      setTimeout(() => server.start(), 1000)
      server.reset()
    }
  }, 5000)
}
