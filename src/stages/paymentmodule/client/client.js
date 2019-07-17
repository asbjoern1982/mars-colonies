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
    'setup': (client, data) => {
      $('#paymentAmount').text(data)
      $('#firstname').keypress(e => validateWithEnter(client, e))
      $('#lastname').keypress(e => validateWithEnter(client, e))
      $('#cprnumber').keypress(e => validateWithEnter(client, e))
      $('#submitButton').mouseup(() => validateAndSend(client))
    }
  },
  setup: (client) => {
    client.send('ready')
  },
  teardown: (client) => {},
  options: {htmlContainerHeight: 0.99}
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
