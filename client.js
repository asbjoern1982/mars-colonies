import createClient from 'monsterr'
import game from './src/stages/game/client/client'
import {CPUModule} from './src/modules/CPUModule'
// import configMain from './src/configMain'
// BUG: cannot read .src/configMain
const stages = [game]

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

CPUModule.setupClient(client)
