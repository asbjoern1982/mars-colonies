import {Model} from './model'
import clientStages from '../../../clientStages'
// import score from './../config/score'

let createView = () => {
  let inventoryBonusLimit
  let inventoryCriticalLimit
  let productionCountDown
  let productionCountTotal
  let productionProgressInterval

  let tradeRoutes

  let tooltip
  let showInventory
  let showScore
  let score
  let canvas
  let resizingCanvas

  let practiceRun

  let startTime
  let timeLeft
  let chat

  let countdownInterval

  let setup = (client, data) => {
    showInventory = data.showInventoryInTooltip
    showScore = data.showScoreInTooltip
    practiceRun = data.practiceRun
    productionCountDown = 0
    productionCountTotal = 0
    chat = {
      'all': {
        tag: undefined,
        text: ''
      }
    }

    setupInterface(client, data)
    setupMap(client)

    score = clientStages.configs[data.stage]

    if (data.soundVolume > 0) {
      $('.bg').append('<audio loop autoplay id="backgroundsound">\n' +
        '<source src="./../../../assets/08-Brian-Cook_raw_velocity_0.6_normalisedx1_2octavesUp_03.wav" type="audio/wav">\n' +
        '</audio>')
      $('.bg').append('<audio loop id="criticalAlarm">\n' +
        '<source src="./../../../assets/ISS-Emergency-short.wav" type="audio/wav">\n' +
        '</audio>')
      $('audio').prop('volume', data.soundVolume)
    }
  }

  let setupInterface = (client, data) => {
    resizingCanvas = false
    inventoryBonusLimit = data.inventoryBonusLimit
    inventoryCriticalLimit = data.inventoryCriticalLimit
    startTime = Date.now()
    timeLeft = data.timeLeft // TODO this ignores lag between server, client and when this i called

    $('#colony-name').text(Model.getColony().name)

    // ----------------- INVENTORY -------------------
    Model.getColony().inventory.forEach(row => {
      let amountColor = row.amount > inventoryBonusLimit ? 'text-success' : row.amount < inventoryCriticalLimit ? 'inventory-critial' : 'inventory-low'
      let tagId = 'inventory' + row.name.replace(' ', '')

      // find starting amount
      let limit = Model.getColony().startingIventory.find(srow => srow.name === row.name).amount

      let criticalPoint = 100 * (row.amount > inventoryCriticalLimit ? inventoryCriticalLimit : row.amount) / limit
      let warningPoint = (100 * (row.amount > inventoryBonusLimit ? inventoryBonusLimit : row.amount) / limit) - criticalPoint
      let bonusPoint = 0
      if (limit >= row.amount) {
        bonusPoint = 100 * (row.amount > inventoryBonusLimit ? row.amount - inventoryBonusLimit : 0) / limit
      } else { // if there is more than the starting inventory, just fill it out
        bonusPoint = 100 * (limit - inventoryBonusLimit) / limit
      }

      // if there is more than starting amount, add a + to indicate that the progress-bar is overflowing
      let overflow = row.amount > Model.getColony().startingIventory.find(srow => srow.name === row.name).amount ? '+' : ' '

      $('#inventory').find('tbody').append(
        '<tr id="' + row.name.replace(/ /g, '') + 'Action">' +
          '<td scope="row"><div class="text-left">' + row.name + '</div></td>' +
          '<td scope="row" class="align-middle">' +
            '<div class="progress bg-dark" style="width: 100%; padding-right:0px;">' +
              '<div class="progress-bar bg-danger"  id="' + tagId + 'cp" role="progressbar" style="width: ' + criticalPoint + '%; margin: 0px;"></div>' +
              '<div class="progress-bar bg-warning"  id="' + tagId + 'wp" role="progressbar" style="width: ' + warningPoint + '%; margin: 0px;"></div>' +
              '<div class="progress-bar bg-success"  id="' + tagId + 'bp" role="progressbar" style="width: ' + bonusPoint + '%; margin: 0px;"></div>' +
            '</div>' +
          '</td>' +
          '<td class="text-success text-left" id="' + tagId + 'overflow" style="padding-left:0px;">' + overflow + '</td>' +
          '<td scope="row" class="' + amountColor + '" id="' + tagId + '">' + row.amount + '</td>' +
        '</tr>')

      $('#' + row.name.replace(/ /g, '') + 'Action').mouseup(e => {
        if (e.ctrlKey || e.shiftKey) {
          let str = $('#chat-input').val()
          if (str.length > 0 && str.charAt(str.length - 1) !== ' ') {
            str += '  '
          }
          $('#chat-input').val(str + row.name + ' ')
          $('#chat-input').focus()
        } else {
          selectMaterial(row.name)
        }
      })
    })

    // -------------------- TRADE --------------------
    let tradeAction = () => {
      let amount = $('#trade-amount').val()
      let material = $('#trade-material').val()
      // ignore anything that isn't a positive number
      if (amount > 0 && !Model.getOtherColonies().find(f => f.name === $('#trade-colony').val()).dead) {
        let sendTransfer = () => {
          if (!Model.getColony().dead && !Model.getOtherColonies().find(f => f.name === $('#trade-colony').val()).dead) {
            $('#trade-amount').val('')
            client.send('trade', {
              colony: $('#trade-colony').val(),
              material: material,
              amount: amount
            })
            Model.getColony().inventory.find(row => row.name === material).amount -= amount
            updateInventory()
          }
        }
        // confirm if it would bring the participant below the critical limit
        if (Model.getColony().inventory.find(row => row.name === material).amount - amount < inventoryCriticalLimit) {
          // close other popups
          $('.modal').modal('hide')
          $('#buttonTransferConfirm').mouseup(() => {
            sendTransfer()
            $('#confirmTransferWindow').modal('hide')
          })
          $('#confirmTransferWindow').on('keydown', e => {
            if (e.keycode === 13 || e.which === 13) {
              sendTransfer()
              $('#confirmTransferWindow').modal('hide')
            }
          })
          $('#confirmTransferWindow').modal('show')
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
    $('#trade-colony').change(e => $('#trade-amount').focus())
    $('#trade-material').change(e => $('#trade-amount').focus())

    // -------------------- PRODUCTION --------------------
    let productionAction = () => {
      if (productionCountDown === 0 && $('#production-amount').val() > 0) {
        let index = $('#production-material').val()
        let amount = $('#production-amount').val()
        let startProduction = () => {
          if (!Model.getColony().dead) {
            $('#production-amount').val('')
            client.send('produce', {
              index: index,
              amount: amount
            })
            productionCountDown = Model.getColony().specializations[index].production_delay

            if (productionCountDown > 0) {
              let interval = 250
              productionCountTotal = productionCountDown
              // countdown loop
              $('#production-progress').css('width', (productionCountTotal - productionCountDown) / productionCountTotal * 100 + '%')
              // $('#production-progress').html('production ' + (productionCountTotal - productionCountDown) / productionCountTotal * 100 + '% done')
              productionCountDown -= interval / 1000
              productionProgressInterval = setInterval(() => {
                if (productionCountDown <= 0) {
                  $('#production-progress').css('width', '0%')
                  // $('#production-progress').html('production finished')
                  clearInterval(productionProgressInterval)
                } else {
                  $('#production-progress').css('width', (productionCountTotal - productionCountDown) / productionCountTotal * 100 + '%')
                  // $('#production-progress').html('production ' + (productionCountTotal - productionCountDown) / productionCountTotal * 100 + '% done')
                  productionCountDown -= interval / 1000
                }
              }, interval)
            } else {
              $('#production-progress').css('width', '0%')
              // $('#production-progress').html('production finished')
            }
          }
        }

        if (Model.getColony().inventory.find(material => material.name === Model.getColony().specializations[index].input).amount - amount < inventoryCriticalLimit) {
          $('.modal').modal('hide')
          $('#buttonProductionConfirm').mouseup(() => startProduction())
          $('#confirmProductionWindow').modal('show')
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
    for (let i = 0; i < Model.getColony().specializations.length; i++) {
      let specialization = Model.getColony().specializations[i]
      let option = specialization.input + ' til ' + specialization.output + ' (' + specialization.gain * 100 + '%, ' + specialization.production_delay + ')'
      $('#production-material').append('<option value="' + i + '">' + option + '</option>')
    }
    $('#production-material').change(e => $('#production-amount').focus())

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
        if ($('#chat-input').val() !== '') {
          let data = {
            sender: Model.getColony().name,
            target: Object.keys(chat).find(key => chat[key].tag.hasClass('active')),
            message: $('#chat-input').val()
          }
          client.send('chat', data)
          $('#chat-input').val($('#chat-input option:first').val())
        }
      })
    } else if (data.chat === 'free') {
      $('#chat-input-bar').append(
        '<div class="input-group-prepend">' +
          '<span class="input-group-text" id="input-label"></span>' +
        '</div>' +
        '<input type="text" class="form-control" id="chat-input" placeholder="skriv en besked">' +
        '<div class="input-group-append">' +
          '<button class="btn btn-default" id="chat-button">send</button>' +
        '</div>')
      $('#input-label').append(Model.getColony().name)
      $('#chat-input').keypress((e) => {
        if (e.which === 13 && $('#chat-input').val() !== '') {
          let data = {
            sender: Model.getColony().name,
            target: Object.keys(chat).find(key => chat[key].tag.hasClass('active')),
            message: $('#chat-input').val()
          }
          client.send('chat', data)
          $('#chat-input').val('')
        }
      })
      $('#chat-button').mouseup(e => {
        e.preventDefault()
        if ($('#chat-input').val() !== '') {
          let data = {
            sender: Model.getColony().name,
            target: Object.keys(chat).find(key => chat[key].tag.hasClass('active')),
            message: $('#chat-input').val()
          }
          client.send('chat', data)
          $('#chat-input').val('')
        }
      })
    } else {
      $('#chat-log').append('chat disabled')
    }

    // direct message system
    if ((Array.isArray(data.chat) && data.chat.length > 0) || data.chat === 'free') {
      chat.all.tag = $('#chatAllLi')
      if (data.allowDirectMessages) {
        $('#chatAllLi').mouseup(e => {
          $('.nav-link').removeClass('active')
          $('#chatAllLi').addClass('active')
          $('#chatAllLi').removeClass('chatTabWarning')
          let chatBox = $('#chat-log')
          chatBox.html(chat.all.text)
          chatBox.scrollTop(chatBox[0].scrollHeight)
          $('#chat-input').focus()
        })

        Model.getOtherColonies().sort((a, b) => a.name.localeCompare(b.name)).forEach(colony => {
          let trimmedName = colony.name.replace(/ /g, '')
          $('#chatTabs').append('<li class="nav-item" id="' + trimmedName + 'Li"><a class="nav-link" href="#" data-toggle="tab" role="button" id="' + trimmedName + 'Action">' + colony.name + '</a></li>')

          $('#' + trimmedName + 'Action').mouseup(e => {
            $('.nav-link').removeClass('active')
            $('#' + trimmedName + 'Action').removeClass('chatTabWarning')
            $('#' + trimmedName + 'Action').addClass('active')

            let chatBox = $('#chat-log')
            chatBox.html(chat[colony.name].text)
            chatBox.scrollTop(chatBox[0].scrollHeight)
            $('#chat-input').focus()
          })

          chat[colony.name] = {
            tag: $('#' + trimmedName + 'Action'),
            text: ''
          }
        })
      }
    }

    // if reconnecting, load previous chat messages
    if (data.chatEvents) {
      data.chatEvents.forEach(event => {
        let chatKey = event.target === 'all' ? 'all' : (event.sender === Model.getColony().name ? event.target : event.sender)
        let senderTag = Model.getColony().name === event.sender ? '<b class="text-warning">' : '<b>'
        chat[chatKey].text += senderTag + event.sender + '</b>&gt; ' + event.message.replace(Model.getColony().name, '<b class="text-warning">' + Model.getColony().name + '</b>') + '<br>'
      })
      let chatBox = $('#chat-log')
      chatBox.html(chat['all'].text)
      chatBox.scrollTop(chatBox[0].scrollHeight)
    }
    if (data.transferLog) {
      let eventLog = $('#event-log')
      data.transferLog.forEach(message => {
        eventLog.append(message.replace(Model.getColony().name, '<span class="text-warning">' + Model.getColony().name + '</span>') + '<br>')
      })
      eventLog.scrollTop(eventLog[0].scrollHeight)
    }
    // if reconnecting and someone was dead
    Model.getColony().dead = Model.getColony().inventory.some(row => row.amount <= 0)
    Model.getOtherColonies().forEach(colony => { colony.dead = colony.inventory.some(row => row.amount <= 0) })
  }

  // setting up the map
  let setupMap = (client) => {
    let canvasElement = document.getElementById('map-canvas')
    canvas = new fabric.Canvas(canvasElement, {
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

    canvas.on('mouse:up', e => {
      if (e.target) {
        let colony = Model.getOtherColonies().find(colony => colony['node'] === e.target)
        if (colony) {
          if (e.e.ctrlKey || e.e.shiftKey) {
            let str = $('#chat-input').val()
            if (str.length > 0 && str.charAt(str.length - 1) !== ' ') {
              str += ' '
            }
            $('#chat-input').val(str + colony.name + ' ')
            $('#chat-input').focus()
          } else {
            selectColony(colony)
          }
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
          $('#map-canvas').remove()
          $('#map-container').html('<canvas id="map-canvas">')
          setupMap(client)
          resizingCanvas = false
        }, 500)
      }
    })
  }

  // update this colonies inventory
  let updateInventory = () => {
    Model.getColony().inventory.forEach(row => {
      let tagId = '#inventory' + row.name.replace(' ', '')
      let tag = $(tagId)
      tag.html(Math.round(row.amount))
      tag.removeClass()
      let amountColor = row.amount > inventoryBonusLimit ? 'text-success' : row.amount < inventoryCriticalLimit ? 'inventory-critial' : 'text-warning'
      tag.addClass(amountColor)

      // find starting amount
      let limit = Model.getColony().startingIventory.find(srow => srow.name === row.name).amount

      let criticalPoint = 100 * (row.amount > inventoryCriticalLimit ? inventoryCriticalLimit : row.amount) / limit
      let warningPoint = (100 * (row.amount > inventoryBonusLimit ? inventoryBonusLimit : row.amount) / limit) - criticalPoint
      let bonusPoint = 0
      if (limit >= row.amount) {
        bonusPoint = 100 * (row.amount > inventoryBonusLimit ? row.amount - inventoryBonusLimit : 0) / limit
      } else { // if there is more than the starting inventory, just fill it out
        bonusPoint = 100 * (limit - inventoryBonusLimit) / limit
      }

      // if there is more than starting amount, add a + to indicate that the progress-bar is overflowing
      let overflow = row.amount > Model.getColony().startingIventory.find(srow => srow.name === row.name).amount ? '+' : ' '

      $(tagId + 'bp').css('width', bonusPoint + '%')
      $(tagId + 'wp').css('width', warningPoint + '%')
      $(tagId + 'cp').css('width', criticalPoint + '%')

      $(tagId + 'overflow').html(overflow)
    })
    checkInventoryAlarm()

    // change the colony to red on the map if it has a critical inventory
    if (Model.getColony().dead) {
      Model.getColony().node.set('fill', 'black')
    } else if (Model.getColony().inventory.some(row => row.amount < inventoryCriticalLimit)) {
      Model.getColony().node.set('fill', 'red')
    } else {
      Model.getColony().node.set('fill', 'grey')
    }
    if (Model.getOtherColonies()[0].inventory) {
      Model.getOtherColonies().forEach(colony => {
        if (colony.dead) {
          colony.node.set('fill', 'black')
        } else if (colony.inventory.some(row => row.amount < inventoryCriticalLimit)) {
          colony.node.set('fill', 'red')
        } else {
          colony.node.set('fill', 'rgb(100,100,100)')
        }
      })
    }
    canvas.requestRenderAll()
  }

  let checkInventoryAlarm = () => {
    let audioTag = $('#criticalAlarm')
    if (audioTag) {
      if (Model.getColony().inventory.some(row => row.amount < inventoryCriticalLimit) && !Model.getColony().dead) {
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
    let height = (showInventory ? 16 + 16 * colony.inventory.length : 0) + (colony.specializations ? 16 + 16 * colony.specializations.length : 0) + (showScore ? 32 : 0) + 3
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
    let text = // colony.name + :
      (showInventory ? 'Lagerbeholdning:\n' + colony.inventory.map(row => '- ' + row.name + ': ' + Math.round(row.amount)).join('\n') + '\n' : '') +
      (colony.specializations ? 'Produktion:\n' + colony.specializations.map(row => '- ' + row.input + ' til ' + row.output).join('\n') + '\n' : '') +
      (showScore ? 'Score:\n' + score.calculateScore(colony, Model.getOtherColonies(), inventoryBonusLimit) : '')
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

  let updateTimeLeft = () => {
    let secondsLeft = timeLeft - Math.floor((Date.now() - startTime) / 1000)
    if (secondsLeft < 0) secondsLeft = 0
    $('#time-left-text').text(secondsLeft)

    let procent = Math.floor(100 * ((Date.now() - startTime) / 1000) / timeLeft)
    $('#time-left-bar').css('width', procent + '%')
  }

  let updateScore = () => {
    let currentScore = score.calculateScore(Model.getColony(), Model.getOtherColonies(), inventoryBonusLimit)
    if (practiceRun) currentScore += ' (Practice Run)'
    $('#score').text(currentScore)
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
    }, 2000) // how long the line changes color

    logEvent(sendingColony.name + ' overførte  ' + Math.round(transfer.amount) + ' ' + transfer.material + ' til ' + receivingColony.name)
  }

  let addChatMessage = (data) => {
    let chatBox = $('#chat-log')
    let chatKey = data.target === 'all' ? 'all' : (data.sender === Model.getColony().name ? data.target : data.sender)

    let message = data.message.replace(Model.getColony().name, '<b class="text-warning">' + Model.getColony().name + '</b>')

    let senderTag = Model.getColony().name === data.sender ? '<b class="text-warning">' : '<b>'
    chat[chatKey].text += senderTag + data.sender + '</b>&gt; ' + message + '<br>'

    if (chat[chatKey].tag.hasClass('active')) {
      chatBox.html(chat[chatKey].text)
      chatBox.scrollTop(chatBox[0].scrollHeight)
    } else {
      chat[chatKey].tag.addClass('chatTabWarning')
      if (chatKey !== 'all') {
        $('#chatDropdownA').addClass('chatTabWarning')
      }
    }
    if (chatKey !== 'all') {
      // rotate the new tag just behind all
      let list = $('#chatTabs').children('li').detach().toArray()

      let trimmedName = data.target.replace(/ /g, '')
      let newList = [list[0], list.find(a => a.id === trimmedName + 'Li')]

      for (let i = 1; i < list.length; i++) {
        if (list[i].id !== trimmedName + 'Li') {
          newList.push(list[i])
        }
      }
      $('#chatTabs').append(newList)
    }
  }

  let logEvent = (message) => {
    let eventLog = $('#event-log')
    let res = message.replace(Model.getColony().name, '<span class="text-warning">' + Model.getColony().name + '</span>')
    eventLog.append(new Date().toLocaleTimeString() + '&gt' + res + '<br>')
    eventLog.scrollTop(eventLog[0].scrollHeight)
  }

  // when a colony is clicked on the map, select it in the trade window, maybe in the chat?
  let selectColony = (colony) => {
    $('#trade-colony').val(colony.name)
  }

  let selectMaterial = (name) => {
    $('#trade-material').val(name)
  }

  // when the game is over, ei time is up, the client receives a 'gameover'
  // The 'status' contains what points each colony earned
  let gameover = (status) => {
    // hide other popups
    $('.modal').modal('hide')
    clearInterval(countdownInterval)

    // highlight own colonyname
    let text = 'Endelige score:<br>' + status.replace(/\n/g, '<br>').replace(Model.getColony().name, '<b class="text-warning">' + Model.getColony().name + '</b>')
    logEvent('game over<br>' + text)
    disableEverything()
    $('.modal').modal('hide') // remove any shown confirm-boxes

    let everyoneIsDead = Model.getOtherColonies().every(colony => colony.dead) && Model.getColony().dead
    $('#gameoverTitle').html(everyoneIsDead ? 'Everyone is dead' : 'Gameover')

    $('#gameoverScore').html(text)
    $('#gameoverWindow').modal('show')

    // countdown
    let seconds = 20
    $('#gameoverCountdown').text(seconds)
    countdownInterval = setInterval(() => {
      seconds--
      $('#gameoverCountdown').text(seconds)
      if (seconds <= 0) {
        clearInterval(countdownInterval)
      }
    }, 1000)
  }

  let killColony = (colonyName) => {
    // when a colony runs out of a material, it dies
    let node // node to be coloered
    if (Model.getColony().name === colonyName) {
      disableEverything()
      clearInterval(productionProgressInterval) // stop production
      node = Model.getColony().node
    } else {
      node = Model.getOtherColonies().find(colony => colony.name === colonyName).node
    }
    node.set('fill', 'black')
    canvas.requestRenderAll()
    logEvent(colonyName + ' døde')
  }

  // when this colony is dead or the game is over, disable all buttons and
  // inputfields
  let disableEverything = () => {
    $('#criticalAlarm').trigger('pause') // stop alarm
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
    updateTimeLeft,
    updateScore,
    trade,
    addChatMessage,
    gameover,
    killColony
  }
}

export const View = createView()
