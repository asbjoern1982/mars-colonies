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

let stages = [
  {stage: survey, config: preSurvey},
  {stage: game, config: {config: round0, score: score}},
  {stage: game, config: {config: round1, score: score}},
  {stage: game, config: {config: round2, score: score}},
  {stage: game, config: {config: round3, score: score}},
  {stage: game, config: {config: round4, score: score}},
  {stage: survey, config: miniIPIP},
  {stage: payment, config: undefined}
]

// steno
import lobby from './stages/lobby/server/server'
import gameSteno from './configurations/steno/game-steno.json'
import surveySteno from './configurations/steno/survey-steno.json'

/*let stages = [
  {stage: lobby, config: undefined},
  {stage: game, config: {config: gameSteno, score: score}},
  {stage: survey, config: surveySteno}
]*/

export default {
  stages: stages.map(s => s.stage),
  participants: 6,
  configs: stages.map(s => {
    if (s.config) return s.config
    else return undefined
  })
}
