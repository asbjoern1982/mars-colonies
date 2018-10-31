import createClient from 'monsterr'
import game from './src/stages/game/client/client'

const stages = [
  game
]

let options = {
  canvasBackgroundColor: 'white',
  htmlContainerHeight: 0 // Hide html
}

let events = {}
let commands = {}

createClient({
  events,
  commands,
  options,
  stages
})
