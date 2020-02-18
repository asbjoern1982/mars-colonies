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

let startingInformation

let myName
let productionIngredient
let productionOutput
let productionOutputStartingAmount

let recent = true

function handleEvent (event) {
  if (event.type === '@monsterr/START_STAGE') {
    socket.emit('event', { type: 'ready', payload: 'bot' })
    console.log('detected stage start, reported ready to the server')
  } else if (event.type === 'setup') {
    console.log('setup data received')
    startingInformation = event.payload

    myName = event.payload.yourName
    productionOutput = event.payload.yourSpecializations[0].output
    productionOutputStartingAmount = event.payload.yourStartingInventory.find(inv => inv.name === productionOutput).amount


    // console.log(event.payload);

    // produce half of startingIventory
    socket.emit('event', { type: 'produce', payload: {
      index: 0,
      amount: Math.round(productionOutputStartingAmount / 2)}
    })
    setTimeout(() => recent = false, 12000)
  } else if (event.type === 'inventories') {
    console.log('recieved inventory update, my inventory: ' + event.payload.find(colony => colony.name === myName).inventory.map(line => Math.round(line.amount)).join())

    if (recent)
      return
    recent = true

    let otherColoniesTotalInventory = event.payload
      .filter(colony => colony.name !== myName)
      .map(colony => colony.inventory.find(line => line.name === productionOutput).amount)
      .reduce((total, num) => total + num, 0)

    let avalibleAmount =  event.payload
      .filter(colony => colony.name === myName)
      .map(colony => colony.inventory.find(line => line.name === productionOutput).amount) - productionOutputStartingAmount

    event.payload.filter(colony => colony.name !== myName).forEach(colony => {
      let targetInventory = colony.inventory.find(line => line.name === productionOutput).amount
      let transferAmount =  avalibleAmount * (productionOutputStartingAmount - targetInventory) / otherColoniesTotalInventory
      if (transferAmount > 0) { // negative if target has more than starting
        console.log('transfering ' + transferAmount + ' to ' + colony.name + ' that has ' + targetInventory)
        socket.emit('event', { type: 'trade', payload: {
          colony: colony.name,
          material: productionOutput,
          amount: Math.round(transferAmount)
        }})
      }
    })

    // produce half of inventory
    let ingreidentInventory = event.payload.find(colony => colony.name === myName).inventory.find(line => line.name === productionOutput).amount
    socket.emit('event', { type: 'produce', payload: {
      index: 0,
      amount: Math.round(ingreidentInventory / 2)}
    })

    setTimeout(() => recent = false, 12000)
  } else {
    console.log('event not handled: ' + event.type)
  }
}
