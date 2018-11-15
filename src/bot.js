const io = require('socket.io-client')
const socket = io('http://localhost:3000/clients').connect()

socket.on('connect', () => console.log('connected'))
socket.on('disconnect', () => {
  console.log('disconnected')
  process.exit(0)
})
socket.on('error', err => console.log(err))
socket.on('event', handleEvent)

function handleEvent (event) {
  console.log('event', event)
  if (event.type === '@monsterr/START_STAGE') { // setup
    socket.emit('event', { type: 'ready', payload: 'bot' })
  } else {
    console.log('event: ' + event.type)
  }
}
