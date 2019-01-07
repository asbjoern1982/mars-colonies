import {Logger} from '../../../database/logger'

export default {
  commands: {},
  events: {
    'pre-survey_result': function (server, clientId, data) {
      Logger.logSurvey(server, clientId, data)
    }
  },
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE', server.getCurrentStage())
    Logger.logEvent(server, 'starting pre survey stage (' + server.getCurrentStage().number + ')')
  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
  },
  options: {}
}
