
import html from './client.html'
import './client.css'

let materials;
let localinventory;

let commands = {
  finish (client) {
    client.stageFinished() // <== this is how a client reports finished
    return false // <== false tells client not to pass command on to server
  }
}

let events = {
  'chat': (client, message) => {
    $('#chat-log').append(message + '\n')
  },
  'transfer': (client, transfer) => {
    // TODO show line between the colonies
  },
  'inventory': (client, inventory) => {
    localinventory = inventory
    updateInventory(inventory)
  },
  'setup': (client, data) => {
    // chat
    $('#input-label').append(data.colonyName)

    // trade
    data.otherColonyNames.forEach(name => $('#trade-colony').append('<option>' + name + '</option>'))
    materials = data.materials
    materials.forEach(material => $('#trade-material').append('<option>' + material.name + '</option>'))

    // production
    data.specilisations.forEach(specilisation => {
      let option = specilisation.input + ' to ' + specilisation.output + ' (' + specilisation.gain + ')'
      $('#production-material').append('<option>' + option + '</option>')
    })

    // start gameloop
    setInterval(gameloop, 1000)
  }
}

export default {
  html,
  commands: commands,
  events: events,

  setup: (client) => {
    let canvas = new fabric.Canvas('map-canvas', {
      selection: false,
      width: 590,
      height: 320,
      backgroundColor: null
    })

    let colonies = []
    colonies.push(new fabric.Rect({
      left: 295,
      top: 150,
      fill: 'grey',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    colonies.push(new fabric.Rect({
      left: 375,
      top: 70,
      fill: 'blue',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    colonies.push(new fabric.Rect({
      left: 215,
      top: 70,
      fill: 'green',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    colonies.push(new fabric.Rect({
      left: 375,
      top: 230,
      fill: 'yellow',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    colonies.push(new fabric.Rect({
      left: 215,
      top: 230,
      fill: 'red',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    canvas.add(...colonies)

    $('#trade-button').mouseup(e => {
      e.preventDefault()
      client.send('trade', {
        colony: $('#trade-colony').val(),
        material: $('#trade-material').val(),
        amount: $('#trade-amount').val()
      })
    })

    $('#chat-button').mouseup(e => {
      e.preventDefault()
      client.send('chat', $('#chat-input').val())
      $('#chat-input').value = ''
    })

    $('#production-button').mouseup(e => {
      e.preventDefault()
      client.send('produce', {
        material: $('#production-material').val(),
        amount: $('#production-amount').val()
      })
      // TODO start timer-countdown-thing
    })

    client.send('ready')
  },

  teardown (client) {},
  options: { htmlContainerHeight: 0.9 }
}

let gameloop = () => {
  // update inventory depletion
  materials.forEach(material => {
    localinventory.find(inventoryMaterial => material.name === inventoryMaterial.name).amount -= material.depletion_rate
    updateInventory(localinventory)
  })
}

let updateInventory = (inventory) => {
  $('#inventory').find('tbody').empty()
  inventory.forEach(row => $('#inventory').find('tbody').append('<tr><th scope="row">' + row.name + '</th><td>' + row.amount + '</td></tr>'))
}
