import html from './clientDA.html'
import './client.css'

let coundowntimer

export default {
  html,
  commands: {
    finish (client) {
      client.stageFinished()
      return false
    }
  },
  events: {
    'status': (client, clients) => {
      $('#playerStatus').html(clients.map(c => '<tr><td class="text-left' + (c.id === client.getId() ? ' text-warning':'') + '">' + c.id + '</td><td' + (c.ready?' class="bg-success"':'') + '>' + (c.ready?'klar':'ikke klar') + '</td></tr>').join(''))

      if (!clients.every(client => client.ready)) {
        // hide modal
        $('#countdownWindow').modal('hide')
        clearInterval(coundowntimer)
        coundowntimer = undefined
      }
    },
    'allReady': (client, delay) => {
      // show modal
      $('#countdownWindow').modal('show')
      let timeleft = delay
      $('#coundownLabel').text(timeleft)
      coundowntimer = setInterval(() => {
        timeleft -= 27
        if (timeleft < 0) timeleft = 0
        $('#coundownLabel').text(timeleft)
      }, 27)
    }
  },
  setup: (client) => {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = './../../../assets/favicon.ico'
    document.getElementsByTagName('head')[0].appendChild(link)

    $('#buttonEnable').change(() => {
      $('#buttonReady').prop('disabled', !$('#buttonEnable').prop('checked'))
    })

    $('#buttonReady').mouseup(() => {
      $('#buttonReady').toggleClass('btn-secondary')
      $('#buttonReady').toggleClass('btn-success')
      client.send('status', $('#buttonReady').hasClass('btn-success'))
    })

    client.send('ready')
  },
  teardown: (client) => {
    $('#doneWindow').modal('hide')
    $('body').removeClass('modal-open')
    $('.modal-backdrop').remove()
  },
  options: {htmlContainerHeight: 1}
}
