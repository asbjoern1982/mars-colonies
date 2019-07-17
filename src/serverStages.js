import game from './stages/game/server/server'
import survey from './stages/survey/server/server'
import payment from './stages/paymentmodule/server/server'

import preSurvey from './stages/survey/config/presurvey.json'
import postSurvey from './stages/survey/config/postsurvey.json'
import round1config from './stages/game/config/config.json'
import round1score from './stages/game/config/score'
import round2 from './stages/game/config/config.json'
import round3 from './stages/game/config/config.json'

let configurations = [
  //{stage: survey, config: preSurvey},
  {stage: game, config: {config: round1config, score: round1score}},
  //{stage: survey, config: postSurvey, },
  {stage: payment, config: undefined}
]

export default {
  stages: configurations.map(config => config.stage),
  participants: 3,
  configurations: configurations.map(config => config.config)
}
