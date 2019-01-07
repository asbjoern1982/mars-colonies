import createClient from 'monsterr'
import presurvey from './src/stages/presurvey/client/client'
import game from './src/stages/game/client/client'

const stages = [
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

createClient({
  events,
  commands,
  options,
  stages
})
