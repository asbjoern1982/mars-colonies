import game from './stages/game/server/server'
import game1 from './stages/game1/server/server'
import game2 from './stages/game2/server/server'
import game3 from './stages/game3/server/server'
import game4 from './stages/game4/server/server'
import survey from './stages/survey/server/server'
import payment from './stages/paymentmodule/server/server'

import preSurvey from './stages/survey/config/presurvey.json'
import postSurvey from './stages/survey/config/postsurvey.json'
import round1config from './stages/game/config/config.json'
import round1score from './stages/game/config/score'
import round2 from './stages/game/config/config.json'
import round3 from './stages/game/config/config.json'

let configurations = [
  {stage: survey, config: preSurvey},
  {stage: game, config: {config: round1config, score: round1score}},
  {stage: game1, config: {config: round1config, score: round1score}},
  {stage: game2, config: {config: round1config, score: round1score}},
  {stage: game3, config: {config: round1config, score: round1score}},
  {stage: game4, config: {config: round1config, score: round1score}},
  {stage: survey, config: postSurvey},
  {stage: payment, config: undefined}
]

export default {
  stages: configurations.map(config => config.stage),
  participants: 6,
  configurations: configurations.map(config => config.config)
}
