import {Model} from './model'

let createView = () => {
  let inventoryBonusLimit
  let inventoryCriticalLimit
  let productionCountDown = 0
  let productionCountTotal = 0
  let gameloopRef

  let tradeRoutes

  let canvas
  let tooltip

  let setupEvent = (client, data) => {
    inventoryBonusLimit = data.inventoryBonusLimit
    inventoryCriticalLimit = data.inventoryCriticalLimit

    // chat
    if (Array.isArray(data.chat) && data.chat.length > 0) {
      $('#chat-input-bar').append('<div class="input-group-prepend">' +
        '<span class="input-group-text" id="input-label"></span>' +
        '</div>' +
        '<select class="form-control" id="chat-input"></select>' +
        '<div class="input-group-prepend-append">' +
        '<button class="btn btn-default" id="chat-button">send</button>' +
        '</div>')
      data.chat.forEach(sentence => $('#chat-input').append('<option>' + sentence + '</option>'))
      $('#input-label').append(Model.thisColony().name)
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
      $('#input-label').append(Model.thisColony().name)
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

    // trade
    Model.otherColonies().forEach(colony => $('#trade-colony').append('<option>' + colony.name + '</option>'))
    Model.materials().forEach(material => $('#trade-material').append('<option>' + material.name + '</option>'))

    // production
    for (let i = 0; i < Model.thisColony().specilisations.length; i++) {
      let specilisation = Model.thisColony().specilisations[i]
      let option = specilisation.input + ' to ' + specilisation.output + ' (' + specilisation.gain * 100 + '%, ' + specilisation.transform_rate + ')'
      $('#production-material').append('<option value="' + i + '">' + option + '</option>')
    }
  }

  let setupClient = (client) => {
    // -------------------- TRADE --------------------
    $('#trade-button').mouseup(e => {
      e.preventDefault()
      let amount = $('#trade-amount').val()
      // ignore anything that isn't a positive number
      if (amount > 0) {
        client.send('trade', {
          colony: $('#trade-colony').val(),
          material: $('#trade-material').val(),
          amount: amount
        })
      }
    })

    // -------------------- PRODUCTION --------------------
    $('#production-button').mouseup(e => {
      e.preventDefault()
      if (productionCountDown === 0 && $('#production-amount').val() > 0) {
        client.send('produce', {
          index: $('#production-material').val(),
          amount: $('#production-amount').val()
        })
        productionCountDown = Model.thisColony().specilisations[$('#production-material').val()].transform_rate
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
    })
  }

  return {
    setupEvent,
    setupClient
  }
}

export const View = createView()
