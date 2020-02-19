const io = require('socket.io-client')
const port = process.argv.includes('serv') ? 8080 : 3000
const socket = io('http://localhost:' + port + '/clients').connect()

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', () => {
  console.log('disconnected')
  process.exit(0)
})
socket.on('error', err => console.log(err))
socket.on('event', handleEvent)

let materials
let myName
let colonies
let input
let output
let inputStartAmount
let outputStartAmount

let producing = false
let gameloop = () => {
  // update inventories
  colonies.forEach(colony => {
    colony.inventory.forEach(line => {
      colonies.find(col => col.name === colony.name).inventory.find(lin => lin.name === line.name).amount -= materials.find(mat => mat.name === line.name).depletion_rate
    })
  })

  // as these are fairly long calls we will have local variables here:
  let inputCurrentAmount = colonies.find(colony => colony.name === myName).inventory.find(line => line.name === input).amount
  let outputCurrentAmount = colonies.find(colony => colony.name === myName).inventory.find(line => line.name === output).amount

  // production
  // if we have more than 1400 input, produce down to 1200, else produce down to 500
  let inputTarget = inputCurrentAmount > 1.4 * inputStartAmount ? 1.2 * inputStartAmount : 0.5 * inputStartAmount
  if (!producing && inputCurrentAmount > inputTarget) {
    // first lock production so we only tell the server to produce when possible
    producing = true
    setTimeout(() => producing = false, 11000) // NOTE: the bot asumes a 10 production second delay and no transfer-delay

    // produce everything down to inputTarget
    let amount = Math.round(inputCurrentAmount - inputTarget)
    console.log('starting producing ' + amount)
    socket.emit('event', { type: 'produce', payload: {
      index: 0,
      amount: amount}
    })
  }

  // transfer
  // only transfer what is more than what we started with of our output-material times 1.2
  let available = outputCurrentAmount - 1.2 * outputStartAmount
  if (available > 0) {
    // first find colonies in need
    let coloniesInNeedList = colonies
      .filter(colony => colony.name !== myName)
      .filter(colony => colony.inventory.find(line => line.name === output).amount < outputStartAmount)

    // find their total amount of output-material
    let totalMissing = coloniesInNeedList
      .map(colony => outputStartAmount - colony.inventory.find(line => line.name === output).amount)
      .reduce((total, num) => total + num, 0)

    coloniesInNeedList.forEach(colony => {
      // send an amount to them proportional to what they are missing to have what they started with
      let colonyOutputCurrentAmountMissing = outputStartAmount - colony.inventory.find(line => line.name === output).amount
      let amount = Math.round(available * colonyOutputCurrentAmountMissing / totalMissing)

      socket.emit('event', { type: 'trade', payload: {
        colony: colony.name,
        material: output,
        amount: amount
      }})
    })
  }
}

function handleEvent (event) {
  if (event.type === '@monsterr/START_STAGE') {
    // tell the server that we are a robot and are ready as we are succesfully connected
    socket.emit('event', { type: 'ready', payload: 'bot' })
    console.log('detected stage start, reported ready to the server')
  } else if (event.type === 'setup') {
    // getting a setup message means that the game has started and it contains all the information that we need
    console.log('setup data received')

    materials = event.payload.materials
    myName = event.payload.yourName
    colonies = event.payload.colonies
    input = event.payload.yourSpecializations[0].input
    output = event.payload.yourSpecializations[0].output
    inputStartAmount = event.payload.yourStartingInventory.find(inv => inv.name === input).amount
    outputStartAmount = event.payload.yourStartingInventory.find(inv => inv.name === output).amount

    // start the internal gameloop
    setInterval(gameloop, 1000)
  } else if (event.type === 'inventories') {
    // update our inventories
    console.log('recieved inventory update')

    colonies.forEach(colony => {
      colony.inventory = event.payload.find(line => line.name === colony.name).inventory
    })
  } else {
    console.log('event not handled: "' + event.type + '" with [' + event.payload + ']')
  }
}
