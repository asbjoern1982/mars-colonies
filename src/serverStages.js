import Ajv from 'ajv'
import schema from './configurations/game.schema.json'

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
import scoreSteno from './configurations/steno/score'

let stagesForTesting = [
  {stage: game, config: {config: round1, score: score}},
]

let stages6Person = [
  {stage: survey, config: preSurvey},
  {stage: game, config: {config: round0, score: score}},
  {stage: game, config: {config: round1, score: score}},
  {stage: game, config: {config: round2, score: score}},
  {stage: game, config: {config: round3, score: score}},
  {stage: game, config: {config: round4, score: score}},
  {stage: survey, config: miniIPIP},
  {stage: payment, config: undefined}
]

let stagesSteno = [
  {stage: lobby, config: undefined},
  {stage: survey, config: surveySteno},
  {stage: game, config: {config: gameSteno, score: scoreSteno}},
]

// set witch set of stages to run, remember to
//  - set it both in clientStages.js and serverStages.js
//  - set the last stage to reset the game/server/server.js with setting "moreStages = false"
//  - set wich language-html to use in client.js
let stages = stages6Person
// the server needs to know how many clients it should wait for before starting the game.
let participants = 6

// validate configuration gamefiles
let validator = new Ajv().compile(schema)
let errors = false
stages.forEach(stage => {
  if (stage.config && stage.config.config && !validator(stage.config.config)) {
    console.log(validator.errors)
    errors = true
  }
})
if (errors) {
  console.log('ERROR: configuration files are not valid')
  process.exit(1)
}

export default {
  stages: stages.map(s => s.stage),
  participants: participants,
  configs: stages.map(s => {
    if (s.config) return s.config
    else return undefined
  })
}
