// import clientPresurvey from './src/stages/presurvey/client/client'
// import serverPresurvey from './src/stages/presurvey/server/server'

import clientGame from './stages/game/client/client'
import serverGame from './stages/game/server/server'

// import clientGame15 from './src/stages/game15/client/client'
// import serverGame15 from './src/stages/game15/server/server'

export default {
  clientStages: [clientGame], // BUG: has to be set in client.js, this file cannot be read by the client
  serverStages: [serverGame],
  participants: 5
}
