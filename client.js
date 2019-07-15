import createClient from 'monsterr'
import {CPUModule} from './src/modules/CPUModule'
import clientStages from './src/clientStages'

const stages = clientStages.stages

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
testFunc.test();
