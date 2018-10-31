import {DatabaseHandler} from '../../../database/DatabaseHandler'

export default {
  commands: {},
  events: {
    'some_event': function (server, clientId, data) {
      DatabaseHandler.logEvent(clientId, 'data')
    }
  },
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE',
      server.getCurrentStage())
  },
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE',
      server.getCurrentStage())
  },
  options: {}
}
