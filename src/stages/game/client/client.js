
import html from './client.html'
import './client.css'

let commands = {
  finish (client) {
    client.stageFinished() // <== this is how a client reports finished
    return false // <== false tells client not to pass command on to server
  }
}

let events = {}

export default {
  html,
  commands: commands,
  events: events,

  // Optionally define a setup method that is run before stage begins
  setup: (client) => {
    // and access html...
    // Here we listen for button clicks.
    $('#stage1-button').mouseup(e => {
      e.preventDefault() // Stop button from default behaviour (You almost always want to do this).
      $('#stage1-title').html($('#stage1-input').val()) // Set title's content to value of input.
    })
  },

  teardown (client) {
    $('#stage1-button').off() // Remove all event handlers from button
  },

  // Configure options
  options: {
    htmlContainerHeight: 1
  }
}
