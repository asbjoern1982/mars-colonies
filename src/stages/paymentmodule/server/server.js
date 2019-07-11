import {Logger} from '../../../database/logger'
import {PaymentHandler} from '../../../database/PaymentHandler'

let completedSurveys

export default {
  commands: {},
  events: {
    'ready': (server, clientId) => {
      server.log('client reported ready: ' + clientId)
      server.send('setup', PaymentHandler.getPayout(clientId)).toClient(clientId)
    },
    'save': function (server, clientId, data) {
      server.log('client saved information: ' + clientId)
      Logger.logEvent(server, 'client saved information: ' + clientId)
      PaymentHandler.saveParticipantInformation(clientId, data)

      completedSurveys++
      if (completedSurveys >= server.getPlayers().length) {
        server.send('logged', 'everyone has completed the payment survey').toAdmin()
      }
    }
  },
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE', server.getCurrentStage())
    Logger.logEvent(server, 'starting payment stage (' + server.getCurrentStage().number + ')')
    PaymentHandler.randomizePayout()
  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE', server.getCurrentStage())
  },
  options: {}
}
