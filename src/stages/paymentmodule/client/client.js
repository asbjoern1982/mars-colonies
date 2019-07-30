import html from './client.html'
import htmlThanks from './thanks.html'
import './client.css'

export default {
  html,
  commands: {
    finish (client) {
      client.stageFinished()
      return false
    }
  },
  events: {
    'setup': (client, results) => {
      let amount = results.rounds.find(r => r.stage === results.selectedRound).participants.find(p => p.clientId === client.getId()).amount
      $('#paymentAmount').text(amount)
      $('#firstname').keypress(e => validateWithEnter(client, e))
      $('#lastname').keypress(e => validateWithEnter(client, e))
      $('#cprnumber').keypress(e => validateWithEnter(client, e))
      $('#submitButton').mouseup(() => validateAndSend(client))

      // Scoreboard setup
      let selected = results.selectedRound
      let headRow = '<th scope="col">Name</th>'
      for (let i = 0; i < results.rounds.length; i++) {
        headRow += '<th scope="col" class="text-right'
        headRow += results.rounds[i].stage === selected ? ' bg-info text-white">' : '">'
        headRow += results.rounds[i].practice ? '<small>practice</small><br>' : ''
        headRow += 'Round ' + results.rounds[i].stage + '</th>'
      }
      $('#scoreHeadRow').html(headRow)

      let participants = []
      results.rounds.forEach(r => r.participants.forEach(participant => participants.push(participant)))
      let colonies = [...new Set(participants.map(p => p.name))].sort()

      colonies.forEach(col => {
        let row = '<tr><th scole="row">' + col + '</th>'

        for (let i = 0; i < results.rounds.length; i++) {
          row += '<td class="text-right'

          let participant = results.rounds[i].participants.find(p => p.name === col)
          if (participant) {
            if (participant.clientId === client.getId()) {
              row += ' text-warning font-weight-bold'
            } else {
              if (results.rounds[i].practice) {
                row += ' text-secondary'
              }
              if (results.rounds[i].stage === selected) {
                row += ' text-white'
              }
            }
            if (results.rounds[i].stage === selected) {
              row += ' bg-info'
            }
          }
          row += '">'
          if (participant) {
            row += participant.amount
          }
          row += '</td>'
        }
        $('#scoreBody').append(row + '</tr>')
      })
    }
  },
  setup: (client) => {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = './../../../assets/favicon.ico'
    document.getElementsByTagName('head')[0].appendChild(link)

    client.send('ready')
  },
  teardown: (client) => {},
  options: {htmlContainerHeight: 1}
}

let validateWithEnter = (client, e) => {
  if (e.which === 13) validateAndSend(client)
}

let validateAndSend = (client) => {
  // Validate
  let hasError = false
  let setInvalid = (tag) => {
    tag.removeClass('is-valid')
    tag.parent().removeClass('is-valid')
    tag.addClass('is-invalid')
    tag.parent().addClass('is-invalid')
    hasError = true
  }

  let setValid = (tag) => {
    tag.removeClass('is-invalid')
    tag.parent().removeClass('is-invalid')
    tag.addClass('is-valid')
    tag.parent().addClass('is-valid')
  }

  // other regex for validating danish cpr numbers
  // ^(?:(?:31(?:0[13578]|1[02])|(?:30|29)(?:0[13-9]|1[0-2])|(?:0[1-9]|1[0-9]|2[0-8])(?:0[1-9]|1[0-2]))[0-9]{2}\s?-?\s?[0-9]|290200\s-?\s[4-9]|2902(?:(?!00)[02468][048]|[13579][26])\s?-?\s?[0-3])[0-9]{3}|000000\s?-?\s?0000$
  // /[0-9]{6}-[0-9]{4}/
  let cprregex = /\b(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])\d{2}-\d{4}\b/
  if (!cprregex.test($('#cprnumber').val())) {
    setInvalid($('#cprnumber'))
  } else {
    setValid($('#cprnumber'))
  }

  if ($('#firstname').val().length === 0) {
    setInvalid($('#firstname'))
  } else {
    setValid($('#firstname'))
  }

  if ($('#lastname').val().length === 0) {
    setInvalid($('#lastname'))
  } else {
    setValid($('#lastname'))
  }

  if (hasError) return

  // if okay, send data and thank the participant
  client.send('save', {
    cprnumber: $('#cprnumber').val(),
    firstname: $('#firstname').val(),
    lastname: $('#lastname').val(),
  })
  // replace html
  $('#paymentInformationCard').html(htmlThanks)
}
