import html from './client.html'
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
    'status': (client, clients) => {
      //$('#playerStatus').empty()
      console.log(clients)
      $('#playerStatus').html(clients.map(c => '<tr><td class="text-left">' + (c.id === client.getId()?c.id + ' (you)':c.id) + '</td><td' + (c.ready?' class="bg-success"':'') + '>' + (c.ready?'ready':'not ready') + '</td></tr>').join(''))
    },
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
  teardown: (client) => {},
  options: {htmlContainerHeight: 0.997}
}
