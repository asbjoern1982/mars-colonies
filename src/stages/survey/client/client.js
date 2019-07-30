import * as Survey from 'survey-jquery'
import html from './client.html'
import htmlThanks from './thanks.html'
import './client.css'

export default {
  html,
  commands: {finish (client) {
    client.stageFinished()
    return false
  }},
  events: {
    'ready': (client, config) => {
      $('#surveyTitle').text(config.title)

      Survey.StylesManager.applyTheme('bootstrap')
      let surveyModel = new Survey.Model(config)

      $('#startSurvey').on('click', () => {
        $('#survey').Survey({
          model: surveyModel,
          onComplete: (survey) => {
            client.send('surveyResult', survey.data)
            $('#survey').html(htmlThanks)
          }
        })
      })
    },
    'everyoneIsReady': () => {
      console.log('everyone is ready, going to next stage in 5')
      // countdown
      let seconds = 5
      $('#countdownSurvey').html('Everyone is finished, the next stage will start in ' + seconds + ' seconds')
      $('#doneCountdown').text(seconds)
      let countdownInterval = setInterval(() => {
        seconds--
        $('#countdownSurvey').html('Everyone is finished, the next stage will start in ' + seconds + ' seconds')
        if (seconds <= 0) {
          clearInterval(countdownInterval)
        }
      }, 1000)
      console.log('showing the window!')
      $('doneWindow').modal('show')
    }
  },
  setup: (client) => {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = './../../../assets/favicon.ico'
    document.getElementsByTagName('head')[0].appendChild(link)

    let script = document.createElement('script')
    script.src="https://surveyjs.azureedge.net/1.1.0/survey.jquery.js"
    document.getElementsByTagName('body')[0].appendChild(script)

    // request survey-data from the server
    client.send('ready')
  },
  teardown: (client) => {
    $('#doneWindow').modal('hide')
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  },
  options: {htmlContainerHeight: 1}
}
