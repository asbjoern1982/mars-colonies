import game from './stages/game/client/client'
import game1 from './stages/game1/client/client'
import game2 from './stages/game2/client/client'
import game3 from './stages/game3/client/client'
import game4 from './stages/game4/client/client'
import survey from './stages/survey/client/client'
import payment from './stages/paymentmodule/client/client'

export default {
  stages: [
    survey,
    game,
    game1,
    game2,
    game3,
    game4,
    survey,
    payment
  ]
}
