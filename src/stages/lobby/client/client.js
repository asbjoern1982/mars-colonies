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

    },
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
