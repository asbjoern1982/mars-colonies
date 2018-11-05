
import html from './client.html'
import './client.css'

let commands = {
  finish (client) {
    client.stageFinished() // <== this is how a client reports finished
    return false // <== false tells client not to pass command on to server
  }
}

let events = {
  'inventory': (client, inventory) => {
    $('#inventory').find('tbody').empty()
    inventory.forEach(row => {
      $('#inventory').find('tbody').append('<tr>')
      $('#inventory').find('tbody').append('<th scope="row">' + row.name + '</th>')
      $('#inventory').find('tbody').append('<td>' + row.amount + '</td>')
      $('#inventory').find('tbody').append('</tr>')
    })
  }
}

export default {
  html,
  commands: commands,
  events: events,

  // Optionally define a setup method that is run before stage begins
  setup: (client) => {
    // and access html...
    // Here we listen for butabletton clicks.
    let canvas = new fabric.Canvas('map-canvas', {
      selection: false,
      width: 590,
      height: 320,
      backgroundColor: null
    })

    let colonies = []
    colonies.push(new fabric.Rect({
      left: 295,
      top: 150,
      fill: 'grey',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    colonies.push(new fabric.Rect({
      left: 375,
      top: 70,
      fill: 'blue',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    colonies.push(new fabric.Rect({
      left: 215,
      top: 70,
      fill: 'green',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    colonies.push(new fabric.Rect({
      left: 375,
      top: 230,
      fill: 'yellow',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    colonies.push(new fabric.Rect({
      left: 215,
      top: 230,
      fill: 'red',
      width: 20,
      height: 20,
      angle: 45,
      selectable: false,
      stroke: 'black',
      strokeWidth: 1
    }))
    canvas.add(...colonies)

    client.send('ready')
  },

  teardown (client) {
    $('#stage1-button').off() // Remove all event handlers from button
  },

  // Configure options
  options: {
    htmlContainerHeight: 1
  }
}
