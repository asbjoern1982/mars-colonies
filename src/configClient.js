import presurvey from './stages/presurvey/client/client'
import game from './stages/game/client/client'
import postsurvey from './stages/postsurvey/client/client'
import payment from './stages/paymentmodule/client/client'

export default {
  stages: [game, postsurvey, payment]
}
