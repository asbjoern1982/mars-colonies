import presurvey from './stages/presurvey/server/server'
import game from './stages/game/server/server'
import postsurvey from './stages/postsurvey/server/server'
import payment from './stages/paymentmodule/server/server'

export default {
  stages: [game, postsurvey, payment],
  participants: 3
}
