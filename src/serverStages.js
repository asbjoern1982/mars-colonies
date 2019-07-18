import game from './stages/game/server/server'
import survey from './stages/survey/server/server'
import payment from './stages/paymentmodule/server/server'

import preSurvey from './stages/survey/config/presurvey.json'
import postSurvey from './stages/survey/config/postsurvey.json'

import round0 from './configurations/game-0_config.json'
import round1 from './configurations/game-1_config.json'
import round2 from './configurations/game-2_config.json'
import round3 from './configurations/game-3_config.json'
import round4 from './configurations/game-4_config.json'
import score from './configurations/score'

let configurations = [
  // {stage: survey, config: preSurvey},
  {stage: game, config: {config: round0, score: score}},
  // {stage: survey, config: postSurvey},
  // {stage: payment, config: undefined}
]

export default {
  stages: configurations.map(config => config.stage),
  participants: 6,
  configurations: configurations.map(config => config.config)
}
