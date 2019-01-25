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

function handleEvent (event) {
  console.log('event', event)
  if (event.type === '@monsterr/START_STAGE') { // setup
    socket.emit('event', { type: 'ready', payload: 'bot' })
  } else {
    console.log('event: ' + event.type)
  }
}
