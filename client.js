import createClient from 'monsterr'
import {CPUModule} from './src/modules/CPUModule'
import clientStages from './src/clientStages'

const stages = clientStages.stages
let connected = true

let options = {
  canvasBackgroundColor: 'white',
  htmlContainerHeight: 0, // Hide html
  hideChat: true
}

let events = {
  'pong': (client) => {
    connected = true
  }
}
let commands = {}

let client = createClient({
  events,
  commands,
  options,
  stages
})

CPUModule.setupClient(client)

setInterval(() => {
  if (!connected) {
    console.log('Connection to server lost, refreshing page')
     // give the server an extra second to come back up
    setTimeout(() => location.reload(), 1000)
  }
  connected = false
  client.send('ping')
}, 10000)
