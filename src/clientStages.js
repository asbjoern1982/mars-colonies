import game from './stages/game/client/client'
import survey from './stages/survey/client/client'
import payment from './stages/paymentmodule/client/client'
import score from './configurations/score'

// steno
import lobby from './stages/lobby/client/client'
import scoreSteno from './configurations/steno/score'

let stages6Person = [
  {stage: survey},
  {stage: game, config: score},
  {stage: game, config: score},
  {stage: game, config: score},
  {stage: game, config: score},
  {stage: game, config: score},
  {stage: survey},
  {stage: payment}
]

let stagesSteno = [
  {stage: lobby},
  {stage: survey},
  {stage: game, config: score},
]

// set witch set of stages to run, see serverStages.js for more instructions
let stages = stages6Person

let getConfig = (stage) => {
  return stages.filter(s => stage)
}

export default {
  stages: stages.map(s => s.stage),
  configs: stages.map(s => {
    if (s.config) return s.config
    else return undefined
  })
}
