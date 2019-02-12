import createClient from 'monsterr'
import {CPUModule} from './src/modules/CPUModule'
import configClient from './src/configClient'

const stages = configClient.stages

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
