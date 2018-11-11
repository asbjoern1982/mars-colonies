
import html from './client.html'
import './client.css'

let materials
let specilisations
let localinventory
let otherColonies
let tradeRoutes
let productionCountDown = 0
let productionCountTotal = 0

let canvas
let tooltip

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
  'inventories': (client, inventories) => {
    // set my inventory for the intenvoryView
    localinventory = inventories.find(colony => colony.id === client.getId()).inventory
    updateInventory(localinventory)
    // set other colonies inventory for the map if it is in the payload
    inventories.filter(colony => colony.id !== client.getId()).forEach(colony => {
      otherColonies.find(otherColony => otherColony.name === colony.name).inventory = colony.inventory
    })
  },
  'setup': (client, data) => {
    materials = data.materials
    specilisations = data.specilisations
    otherColonies = []
    data.otherColonyNames.forEach(name => otherColonies.push({
      name: name,
      inventory: []
    }))

    // chat
    $('#input-label').append(data.colonyName)

    // trade
    data.otherColonyNames.forEach(name => $('#trade-colony').append('<option>' + name + '</option>'))
    materials.forEach(material => $('#trade-material').append('<option>' + material.name + '</option>'))

    // production
    specilisations.forEach(specilisation => {
      let option = specilisation.input + ' to ' + specilisation.output + ' (' + specilisation.gain * 100 + '%)'
      $('#production-material').append('<option value="' + specilisation.input + '">' + option + '</option>')
    })

    // add nodes to the map
    setupMap()

    // start gameloop
    setInterval(gameloop, 1000)
  }
}

export default {
  html,
  commands: commands,
  events: events,

  setup: (client) => {
    // -------------------- TRADE --------------------
    $('#trade-button').mouseup(e => {
      e.preventDefault()
      client.send('trade', {
        colony: $('#trade-colony').val(),
        material: $('#trade-material').val(),
        amount: $('#trade-amount').val()
      })
    })

    // -------------------- CHAT --------------------
    $('#chat-input').keypress((e) => {
      if (e.which === 13) {
        client.send('chat', $('#chat-input').val())
        $('#chat-input').val('')
      }
    })
    $('#chat-button').mouseup(e => {
      e.preventDefault()
      client.send('chat', $('#chat-input').val())
      $('#chat-input').val('')
    })

    // -------------------- PRODUCTION --------------------
    $('#production-button').mouseup(e => {
      e.preventDefault()
      if (productionCountDown > 0) return

      client.send('produce', {
        material: $('#production-material').val(),
        amount: $('#production-amount').val()
      })
      productionCountDown = specilisations.find(specilisation => specilisation.input === $('#production-material').val()).transform_rate
      productionCountTotal = productionCountDown
      $('#production-progress').html('production ' + (productionCountTotal - productionCountDown) / productionCountTotal * 100 + '% done')
      productionCountDown--
      // countdown loop
      let intervalRef = setInterval(() => {
        if (productionCountDown <= 0) {
          $('#production-progress').html('production finished')
          clearInterval(intervalRef)
        } else {
          $('#production-progress').html('production ' + (productionCountTotal - productionCountDown) / productionCountTotal * 100 + '% done')
          productionCountDown--
        }
      }, 1000)
    })

    client.send('ready')
  },

  teardown (client) {},
  options: {
    htmlContainerHeight: 1,
    hideChat: true
  }
}

let gameloop = () => {
  // update inventory depletion
  materials.forEach(material => {
    localinventory.find(inventoryMaterial => material.name === inventoryMaterial.name).amount -= material.depletion_rate
  })
  updateInventory(localinventory)

  otherColonies.forEach(colony => {
    materials.forEach(material => {
      colony.inventory.find(inventoryMaterial => material.name === inventoryMaterial.name).amount -= material.depletion_rate
    })
  })
  updateTooltip()
}

let updateInventory = (inventory) => {
  $('#inventory').find('tbody').empty()
  inventory.forEach(row => $('#inventory').find('tbody').append('<tr><th scope="row">' + row.name + '</th><td>' + row.amount + '</td></tr>'))
}

let updateTooltip = () => {
  if (tooltip) {
    let text = tooltip.colony.name + tooltip.colony.inventory.map(row => '\n' + row.name + ': ' + row.amount)
    let newtooltip = new fabric.Text(text, {
      left: tooltip.left,
      top: tooltip.top,
      width: tooltip.width,
      height: tooltip.width,
      fontSize: 12
    })
    newtooltip['colony'] = tooltip.colony
    canvas.remove(tooltip)
    tooltip = newtooltip
    canvas.add(tooltip)
  }
}

let setupMap = () => {
  canvas = new fabric.Canvas('map-canvas', {
    selection: false,
    width: 590,
    height: 320,
    backgroundColor: null
  })
  canvas.clear()

  let centerX = 590 / 2
  let centerY = 320 / 2 - 10

  // the center colony
  let colonyNode = new fabric.Rect({
    left: centerX,
    top: centerY,
    fill: 'grey',
    width: 20,
    height: 20,
    angle: 45,
    selectable: false,
    stroke: 'black',
    strokeWidth: 1
  })
  canvas.add(colonyNode)

  let colors = ['Green', 'Red', 'Blue', 'Pink', 'Yellow', 'Indigo', 'Violet', 'Orange', 'Cyan', 'LightGreen', 'CadetBlue', 'Brown', 'Lime', 'Wheat']
  let angleBetweenColonies = 2 * Math.PI / otherColonies.length
  for (let i = 0; i < otherColonies.length; i++) {
    let angle = angleBetweenColonies * i + Math.PI / 3.5
    let radius = 80
    let x = Math.sin(angle) * radius + centerX
    let y = Math.cos(angle) * radius + centerY
    let rect = new fabric.Rect({
      left: x,
      top: y,
      fill: colors[i],
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    })
    canvas.add(rect)
    otherColonies[i]['node'] = rect
  }

  canvas.on('mouse:over', (e) => {
    if (e.target) {
      let colony = otherColonies.find(colony => colony['node'] === e.target)
      if (colony) {
        console.log('mouse-over: ' + colony.name + '\ninventory: ' + colony.inventory)
        let text = colony.name + colony.inventory.map(row => '\n' + row.name + ': ' + row.amount)
        tooltip = new fabric.Text(text, {
          left: e.target.left + 20,
          top: e.target.top + 20,
          width: 100,
          height: 100,
          fontSize: 12
        })
        canvas.add(tooltip)
        tooltip['colony'] = colony
      }
    }
  })
  canvas.on('mouse:out', (e) => {
    if (e.target) {
      let colony = otherColonies.find(colony => colony['node'] === e.target)
      if (colony) {
        console.log('mouse-out: ' + colony.name)
        canvas.remove(tooltip)
        tooltip = undefined
      }
    }
  })

  tradeRoutes = []
  let allColonyNodes = [colonyNode, ...otherColonies.map(colony => colony.node)]
  allColonyNodes.forEach(startColony => {
    allColonyNodes.forEach(endColony => {
      if (startColony !== endColony) {
        let tradeRoute = new fabric.Path('M 65 0 Q 100, 100, 200, 0', { fill: '', stroke: 'black', strokeWidth: 2, objectCaching: false })

        tradeRoute.startColony = startColony
        tradeRoute.endColony = endColony

        tradeRoute.path[0][1] = startColony.left
        tradeRoute.path[0][2] = startColony.top

        tradeRoute.path[1][1] = endColony.left
        tradeRoute.path[1][2] = endColony.top

        // tradeRoute.path[1][3] = endColony.node.left
        // tradeRoute.path[1][4] = endColony.node.top

        console.log('(' + startColony.left + ', ' + startColony.top + ') to (' + endColony.left + ', ' + endColony.top + ')')

        tradeRoute.selectable = false
        canvas.add(tradeRoute)
        tradeRoutes.push(tradeRoute)
      }
    })
  })
}
