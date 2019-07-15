import {Logger} from '../../../database/logger'
import {Events} from 'monsterr'
import serverStages from '../../../serverStages'

let completedSurveys = 0

export default {
  commands: {},
  events: {
    'ready': (server, clientId) => {
      server.send('ready', serverStages.configurations[server.getCurrentStage().number]).toClient(clientId)
    },
    'surveyResult': (server, clientId, data) => {
      Logger.logSurvey(server, clientId, data)
      completedSurveys++
      if (completedSurveys >= server.getPlayers().length) {
        server.send('logged', 'everyone has completed the survey').toAdmin()
        // send message to clients and set a timeout
        server.send('everyoneIsReady').toAll()
        setTimeout(() => {
          server.nextStage()
        }, 5000)
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
    Logger.logEvent(server, 'starting post survey stage (' + server.getCurrentStage().number + ')')
    console.log('Starting stage: ' + serverStages.configurations[server.getCurrentStage().number].title)
    completedSurveys = 0 // this carries over from previous stages
  },
  teardown: (server) => {
    // console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
  },
  options: {}
}
