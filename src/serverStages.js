import game from './stages/game/server/server'
import survey from './stages/survey/server/server'
import payment from './stages/paymentmodule/server/server'

import preSurvey from './stages/survey/config/presurvey.json'
import postSurvey from './stages/survey/config/postsurvey.json'
import miniIPIP from './configurations/miniIPIP.json'

import round0 from './configurations/game-0_config.json'
import round1 from './configurations/game-1_config.json'
import round2 from './configurations/game-2_config.json'
import round3 from './configurations/game-3_config.json'
import round4 from './configurations/game-4_config.json'
import score from './configurations/score'

// steno
import lobby from './stages/lobby/server/server'
import gameSteno from './configurations/steno/game-steno.json'
import surveySteno from './configurations/steno/survey-steno.json'

let stages = [
  {stage: lobby, config: undefined},
  {stage: survey, config: surveySteno},
  {stage: game, config: {config: gameSteno, score: score}},
]

export default {
  stages: stages.map(s => s.stage),
  participants: 3,
  configs: stages.map(s => {
    if (s.config) return s.config
    else return undefined
  })
}
