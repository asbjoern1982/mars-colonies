import createClient from 'monsterr'
import presurvey from './src/stages/presurvey/client/client'
import game from './src/stages/game/client/client'
import {CPUModule} from './src/modules/CPUModule'
import config from './src/stages/game/config/config.json'

const stages = config.skipSurveys ? [game] : [
  presurvey,
  game
]

let options = {
  canvasBackgroundColor: 'white',
  htmlContainerHeight: 0, // Hide html
  hideChat: true
}

let events = {}
let commands = {}

let client = createClient({
  events,
  commands,
  options,
  stages
})

console.log(client)
CPUModule.setupClient(client)
