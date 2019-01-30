import {Model} from './model'

let createView = () => {
  let inventoryBonusLimit
  let inventoryCriticalLimit
  let productionCountDown = 0
  let productionCountTotal = 0

  let tradeRoutes

  let tooltip
  let canvas
  let resizingCanvas = false

  let setup = (client, data) => {
    setupInterface(client, data)
    setupMap(client)

    if (data.sounds) {
      $('.bg').append('<audio loop autoplay id="backgroundsound">\n' +
        '<source src="./../../../assets/08-Brian-Cook_raw_velocity_0.6_normalisedx1_2octavesUp_03.wav" type="audio/wav">\n' +
        '</audio>')
      $('.bg').append('<audio loop id="criticalAlarm">\n' +
        '<source src="./../../../assets/ISS-Emergency-short.wav" type="audio/wav">\n' +
        '</audio>')
    }
  }

  let setupInterface = (client, data) => {
    inventoryBonusLimit = data.inventoryBonusLimit
    inventoryCriticalLimit = data.inventoryCriticalLimit

    let jqueryConfirmCssLink = document.querySelector("link[rel*='jquery-confirm.min.css']") || document.createElement('link')
    jqueryConfirmCssLink.rel = 'stylesheet'
    jqueryConfirmCssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.css'
    document.getElementsByTagName('head')[0].appendChild(jqueryConfirmCssLink)

    // https://www.sitepoint.com/dynamically-load-jquery-library-javascript/
    let script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js'
    document.getElementsByTagName('head')[0].appendChild(script)

    $('#colony-title').html('Controle Panel for: ' + Model.getColony().name)

    // -------------------- TRADE --------------------
    let tradeAction = () => {
      let amount = $('#trade-amount').val()
      // ignore anything that isn't a positive number
      if (amount > 0) {
        $('#trade-amount').val('')
        let sendTransfer = () => {
          client.send('trade', {
            colony: $('#trade-colony').val(),
            material: $('#trade-material').val(),
            amount: amount
          })
        }
        // confirm if it would bring the participant below the critical limit
        if (Model.getColony().inventory.find(material => material.name === $('#trade-material').val()).amount - amount < inventoryCriticalLimit) {
          $.confirm({
            title: 'Your inventory will be lower than the critical limit, continue?',
            buttons: {
              confirm: {
                text: 'confirm',
                btnClass: 'btn-blue',
                keys: ['enter'],
                action: () => {
                  sendTransfer()
                }
              },
              cancel: () => {}
            }
          })
        } else {
          sendTransfer()
        }
      }
    }
    $('#trade-button').mouseup(e => {
      e.preventDefault()
      tradeAction()
    })
    $('#trade-amount').keypress((e) => {
      if (e.which === 13) {
        tradeAction()
      }
    })
    Model.getOtherColonies().forEach(colony => $('#trade-colony').append('<option>' + colony.name + '</option>'))
    Model.getMaterials().forEach(material => $('#trade-material').append('<option>' + material.name + '</option>'))

    // -------------------- PRODUCTION --------------------
    let productionAction = () => {
      if (productionCountDown === 0 && $('#production-amount').val() > 0) {
        let index = $('#production-material').val()
        let amount = $('#production-amount').val()
        $('#production-amount').val('')
        let startProduction = () => {
          client.send('produce', {
            index: index,
            amount: amount
          })
          productionCountDown = Model.getColony().specilisations[index].transform_rate
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
        }

        if (Model.getColony().inventory.find(material => material.name === Model.getColony().specilisations[index].input).amount - amount < inventoryCriticalLimit) {
          $.confirm({
            title: 'Your inventory will be lower than the critical limit, continue?',
            buttons: {
              confirm: () => { startProduction() },
              cancel: () => {}
            }
          })
        } else {
          startProduction()
        }
      }
    }
    $('#production-button').mouseup(e => {
      e.preventDefault()
      productionAction()
    })
    $('#production-amount').keypress((e) => {
      if (e.which === 13) {
        productionAction()
      }
    })
    for (let i = 0; i < Model.getColony().specilisations.length; i++) {
      let specilisation = Model.getColony().specilisations[i]
      let option = specilisation.input + ' to ' + specilisation.output + ' (' + specilisation.gain * 100 + '%, ' + specilisation.transform_rate + ')'
      $('#production-material').append('<option value="' + i + '">' + option + '</option>')
    }

    // -------------------- CHAT --------------------
    if (Array.isArray(data.chat) && data.chat.length > 0) {
      $('#chat-input-bar').append('<div class="input-group-prepend">' +
        '<span class="input-group-text" id="input-label"></span>' +
        '</div>' +
        '<select class="form-control" id="chat-input"></select>' +
        '<div class="input-group-prepend-append">' +
        '<button class="btn btn-default" id="chat-button">send</button>' +
        '</div>')
      data.chat.forEach(sentence => $('#chat-input').append('<option>' + sentence + '</option>'))
      $('#input-label').append(Model.getColony().name)
      $('#chat-button').mouseup(e => {
        e.preventDefault()
        client.send('chat', $('#chat-input').val())
        $('#chat-input').val($('#chat-input option:first').val())
      })
    } else if (data.chat === 'free') {
      $('#chat-input-bar').append('<div class="input-group-prepend">' +
        '<span class="input-group-text" id="input-label"></span>' +
        '</div>' +
        '<input type="text" class="form-control" id="chat-input" placeholder="write a message">' +
        '<div class="input-group-prepend-append">' +
        '<button class="btn btn-default" id="chat-button">send</button>' +
        '</div>')
      $('#input-label').append(Model.getColony().name)
      $('#chat-input').keypress((e) => {
        if (e.which === 13) {
          client.send('chat', $('#chat-input').val())
          $('#chat-input').val('')
        }
      })
      $('#chat-button').mouseup(e => {
        e.preventDefault()
        if ($('#chat-input').val() !== '') {
          client.send('chat', $('#chat-input').val())
          $('#chat-input').val('')
        }
      })
    } else {
      $('#chat-log').append('chat disabled')
    }
  }

  // setting up the map
  let setupMap = (client) => {
    canvas = new fabric.Canvas('map-canvas', {
      selection: false,
      width: $('#map-canvas').width(),
      height: $('#map-canvas').height(),
      backgroundColor: null
    })
    canvas.clear()

    let centerX = canvas.width / 2
    let centerY = canvas.height / 2

    // the center colony
    let centerNode = new fabric.Circle({
      left: centerX,
      top: centerY,
      fill: 'grey',
      radius: 10,
      originX: 'center',
      originY: 'center',
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    })
    canvas.add(centerNode)
    Model.getColony()['node'] = centerNode

    // the surrounding colonies
    // as the game is not designed for more than 6 to 10 players, this is enough, any more nodes than these will be Grey
    let angleBetweenColonies = 2 * Math.PI / Model.getOtherColonies().length
    for (let i = 0; i < Model.getOtherColonies().length; i++) {
      let angle = angleBetweenColonies * i + Math.PI / 3.5
      let radius = 80
      let x = Math.sin(angle) * radius + centerX
      let y = Math.cos(angle) * radius + centerY
      let node = new fabric.Circle({
        left: x,
        top: y,
        fill: 'rgb(100,100,100)',
        radius: 10,
        originX: 'center',
        originY: 'center',
        selectable: false,
        stroke: 'black',
        strokeWidth: 1
      })
      let colony = Model.getOtherColonies()[i]
      colony['node'] = node

      let aAngle = Math.PI * 2 * Math.random()
      let aX = Math.sin(aAngle) * 10 + x
      let aY = Math.cos(aAngle) * 10 + y
      let anode = new fabric.Circle({
        left: aX,
        top: aY,
        fill: 'rgb(100,100,100)',
        radius: 5,
        originX: 'center',
        originY: 'center',
        selectable: false,
        stroke: 'black',
        strokeWidth: 1
      })
      canvas.add(anode)
      canvas.add(node)

      let xOffset = (x - centerX) / 6
      let yOffset = (y - centerY) / 6

      let name = new fabric.Text(colony.name, {
        left: x + xOffset,
        top: y + yOffset,
        originX: xOffset >= 0 ? 'left' : 'right',
        originY: yOffset >= 0 ? 'top' : 'bottom',
        fontSize: 16,
        shadow: 'rgba(0,0,0,0.3) 0px 0px 5px',
        // fontWeight: 'bold',
        selectable: false,
        fill: 'white'
      })
      canvas.add(name)
    }

    // on mouse over a colony that is not our own, a tooltip is shown with information
    canvas.on('mouse:over', (e) => {
      if (e.target) {
        let colony = Model.getOtherColonies().find(colony => colony['node'] === e.target)
        if (colony) {
          tooltip = createTooltip(colony, e.target.left + 20, e.target.top + 20)
          canvas.add(tooltip)
          client.send('mouseover-colony', colony.name)
        }
      }
    })
    // the tooltip is cleared when the mouse is not hovering over the colony anymore
    canvas.on('mouse:out', (e) => {
      if (e.target) {
        let colony = Model.getOtherColonies().find(colony => colony['node'] === e.target)
        if (colony) {
          canvas.remove(tooltip)
          tooltip = undefined
        }
      }
    })

    // creating trade routes for displaying visual cues when a transfer of material has happened
    tradeRoutes = []
    let doneRoutes = []
    let yOffset = 0
    Model.getOtherColonies().forEach(startColony => {
      // route to the center
      let start = {x: startColony.node.left, y: startColony.node.top + yOffset}
      let main = {x: centerNode.left, y: centerNode.top + yOffset}
      let line = [main.x, main.y, start.x, start.y]
      let tradeRouteToMain = new fabric.Line(line, { fill: '', stroke: 'black', strokeWidth: 2, selectable: false, objectCaching: false })
      tradeRouteToMain.startColony = Model.getColony()
      tradeRouteToMain.endColony = startColony
      canvas.add(tradeRouteToMain)
      tradeRoutes.push(tradeRouteToMain)

      // route to other colonies
      Model.getOtherColonies().forEach(endColony => {
        let end = {x: endColony.node.left, y: endColony.node.top + yOffset}

        let isConnected = false
        tradeRoutes.forEach(route => {
          if (route.startColony.name === endColony.name &&
            route.endColony.name === startColony.name) {
            isConnected = true
          }
        })

        // the connection between other colonies should not be straight, as it
        // would go through this colonies node in the center, so a curved
        // line is used
        if (startColony.name !== endColony.name && !isConnected) {
          let path = 'M ' + start.x + ' ' + start.y + ' Q 0 ' + end.x + ' ' + end.y
          let tradeRoute = new fabric.Path(path, { fill: '', stroke: 'black', strokeWidth: 2, selectable: false, objectCaching: false })

          tradeRoute.startColony = startColony
          tradeRoute.endColony = endColony
          doneRoutes.push({sX: start.x, sY: start.y, eX: end.x, eY: end.y})

          tradeRoute.path[0][1] = start.x
          tradeRoute.path[0][2] = start.y

          let center = { // centerpoint of line
            x: Math.min(start.x, end.x) + Math.abs(start.x - end.x) / 2,
            y: Math.min(start.y, end.y) + Math.abs(start.y - end.y) / 2
          }
          let vector
          // if the center is close to main, rotate the vector
          if (center.x - main.x < 0.01 && center.x - main.x > -0.01 &&
            center.y - main.y < 0.01 && center.y - main.y > -0.01) {
            vector = {
              x: center.x - start.x,
              y: center.y - start.y
            }
            vector = {x: vector.y * -1, y: vector.x}
          // vector from centerpoint of circle to centerpoint of line
          } else {
            vector = {
              x: center.x - main.x,
              y: center.y - main.y
            }
          }
          let len = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2))
          let mult = Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2)) / 4
          tradeRoute.path[1][1] = center.x + vector.x * mult / len // normalize and magnify
          tradeRoute.path[1][2] = center.y + vector.y * mult / len // normalize and magnify

          tradeRoute.path[1][3] = end.x
          tradeRoute.path[1][4] = end.y

          tradeRoute.selectable = false
          canvas.add(tradeRoute)
          tradeRoutes.push(tradeRoute)
        }
      })
    })
    canvas.getObjects().filter(object => object.type === 'circle').forEach(circle => canvas.bringToFront(circle))
    $(window).resize(() => {
      $('#map-canvas').remove()
      $('#map-container').html('<canvas id="map-canvas">')
      if (!resizingCanvas) {
        resizingCanvas = true
        setTimeout(() => {
          setupMap(client)
          resizingCanvas = false
        }, 500)
      }
    })
  }

  // update this colonies inventory
  let updateInventory = () => {
    $('#inventory').find('tbody').empty()
    Model.getColony().inventory.forEach(row => {
      let amountColor = row.amount > inventoryBonusLimit ? 'inventory-bonus' : row.amount < inventoryCriticalLimit ? 'inventory-critial' : 'inventory-low'
      $('#inventory').find('tbody').append('<tr><th scope="row">' + row.name + '</th><td class="' + amountColor + '">' + row.amount + '</td></tr>')
    })
    checkInventoryAlarm()
  }

  let checkInventoryAlarm = () => {
    let audioTag = $('criticalAlarm')
    if (audioTag) {
      if (Model.getColony().inventory.some(row => row.amount < inventoryCriticalLimit)) {
        audioTag.trigger('play')
      } else {
        audioTag.trigger('pause')
      }
    }
  }

  // if there is a tooltip showing, it should be updated, this is done by removing the old and creating a new one
  let updateTooltip = () => {
    if (tooltip) {
      let newtooltip = createTooltip(tooltip.colony, tooltip.left, tooltip.top)
      canvas.remove(tooltip)
      tooltip = newtooltip
      canvas.add(tooltip)
    }
  }

  // create and return a tooltip with the appropiate information
  let createTooltip = (colony, left, top) => {
    let height = (colony.inventory ? 16 + 16 * colony.inventory.length : 0) + (colony.specilisations ? 16 + 16 * colony.specilisations.length : 0) + 3
    let adjustedTop = top + height + 4 > canvas.height ? canvas.height - height - 4 : top
    let tooltipBackground = new fabric.Rect({
      left: left,
      top: adjustedTop,
      width: 125,
      height: height,
      fill: 'black',
      stroke: 'grey',
      opacity: 0.75,
      strokeWidth: 1
    })
    // only display information if it is pressen on the colony
    let text = // colony.name +
      (colony.inventory ? 'Inventory:\n' + colony.inventory.map(row => '- ' + row.name + ': ' + row.amount).join('\n') : '') +
      (colony.specilisations ? '\nSpecilisations:\n' + colony.specilisations.map(row => '- ' + row.input + ' to ' + row.output).join('\n') : '')
    let tooltipText = new fabric.Text(text, {
      left: left + 3,
      top: adjustedTop + 3,
      width: 100,
      height: 100,
      fontSize: 12,
      fill: 'white',
      linethrough: colony.dead
    })
    let newtooltip = new fabric.Group([tooltipBackground, tooltipText])
    newtooltip.colony = colony
    return newtooltip
  }

  let trade = (transfer) => {
    // when a trade has happened, the route between sender and receiver is
    // found and flashed white for a second as a visual cue to the participant
    // that a trade has happened
    let sendingColony = Model.getOtherColonies().find(colony => colony.name === transfer.sender) || Model.getColony()
    let receivingColony = Model.getOtherColonies().find(colony => colony.name === transfer.receiver) || Model.getColony()
    let route = tradeRoutes.find(route => (route.startColony === sendingColony && route.endColony === receivingColony) ||
      (route.startColony === receivingColony && route.endColony === sendingColony))
    route.stroke = 'white'
    canvas.requestRenderAll()
    setTimeout(() => {
      route.stroke = 'black'
      canvas.requestRenderAll()
    }, 1000)

    logEvent(sendingColony.name + ' transfered  ' + transfer.amount + ' ' + transfer.material + ' to ' + receivingColony.name)
  }

  let addChatMessage = (message) => {
    let chatLog = $('#chat-log')
    chatLog.append(message + '\n')
    chatLog.scrollTop(chatLog[0].scrollHeight)
  }

  let logEvent = (message) => {
    let eventLog = $('#event-log')
    eventLog.append(new Date().toLocaleTimeString() + '>' + message + '\n')
    eventLog.scrollTop(eventLog[0].scrollHeight)
  }

  let gameover = (status) => {
    // when the game is over, ei time is up, the client receives a 'gameover'
    // The 'status' contains what points each colony earned
    logEvent('game over\n' + status)
    disableEverything()
  }

  let killColony = (colonyName) => {
    // when a colony runs out of a material, it dies
    let node
    if (Model.getColony().name === colonyName) {
      disableEverything()
      node = Model.getColony().node
    } else {
      node = Model.getOtherColonies().find(colony => colony.name === colonyName).node
    }
    node.set('fill', 'rgb(179, 0, 0)')
    canvas.requestRenderAll()
    logEvent(colonyName + ' have died')
  }

  // when this colony is dead or the game is over, disable all buttons and
  // inputfields
  let disableEverything = () => {
    $('#trade-colony').prop('disabled', true)
    $('#trade-material').prop('disabled', true)
    $('#trade-amount').prop('disabled', true)
    $('#trade-button').prop('disabled', true)
    $('#production-material').prop('disabled', true)
    $('#production-amount').prop('disabled', true)
    $('#production-button').prop('disabled', true)
  }

  return {
    setup,
    updateInventory,
    updateTooltip,
    createTooltip,
    trade,
    addChatMessage,
    gameover,
    killColony
  }
}

export const View = createView()
