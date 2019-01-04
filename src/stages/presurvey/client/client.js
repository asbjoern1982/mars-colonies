import * as Survey from 'survey-jquery'
import html from './client.html'
import htmlThanks from './thanks.html'
import './client.css'
import surveyJSON from './survey.json'

export default {
  html,
  commands: {finish (client) {
    client.stageFinished()
    return false
  }},
  events: {},
  setup: (client) => {
    Survey.StylesManager.applyTheme('bootstrap')
    let surveyModel = new Survey.Model(surveyJSON)

    $('#client-start-survey').on('click', () => {
      // TODO as we do not have access to links and scripts this workaround seems to work
      $.getScript('https://surveyjs.azureedge.net/1.0.25/survey.jquery.min.js')
        .done(() => {
          $('#pre-survey').Survey({
            model: surveyModel,
            onComplete: (survey) => {
              client.send('pre-survey_result', survey.data)
              $('#pre-survey').html(htmlThanks)
            } // TODO add tell the server whenever an answer is answered
          })
        })
        .fail(() => {
          $('#pre-survey').html('<h3>ERROR, could not retrieve surveyjs script</h3>')
        })
    })
  },
  teardown: (client) => {},
  options: {htmlContainerHeight: 1}
}
