const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const fs = require('fs')

// Singleton for handling database connection
let createDatabaseHandler = () => {
  // if the logs-directory does not exist, create it
  let directory = './src/database/logs/'
  if (!fs.existsSync(directory)) fs.mkdirSync(directory)

  // create a new file with a uniqe name as not to overwrite old logs
  let filename = directory + Date.now() + '.json'
  let adapter = new FileSync(filename)
  let db = low(adapter)
  db.defaults({
    chat: [],
    production: [],
    trade: [],
    inventory: [],
    logMouseOverColony: [],
    events: [],
    surveys: []
  }).write()

  // log a chatmessage with who sent it and the message
  let saveChat = (clientId, message) => {
    let event = {
      id: clientId,
      time: Date.now(),
      message: message
    }
    db.get('chat').push(event).write()
  }

  // log that a specilisation has been used
  let saveProduction = (clientId, index, amount) => {
    let event = {
      id: clientId,
      time: Date.now(),
      index: index,
      amount: Math.floor(amount)
    }
    db.get('production').push(event).write()
  }

  // log a transfer of materials
  let saveTrade = (clientId, receiver, material, amount) => {
    let event = {
      id: clientId,
      time: Date.now(),
      receiver: receiver,
      material: material,
      amount: Math.floor(amount)
    }
    db.get('trade').push(event).write()
  }

  // at a certain interval the inventory of a client is logged for redundant storage
  let saveInventory = (clientId, inventory) => {
    let event = {
      id: clientId,
      time: Date.now(),
      inventory: inventory
    }
    db.get('inventory').push(event).write()
  }

  // log that a client has moved their mouse over an other colony on the map
  let saveMouseOverColony = (clientId, colony) => {
    let event = {
      id: clientId,
      time: Date.now(),
      colony: colony
    }
    db.get('logMouseOverColony').push(event).write()
  }

  // log any other events, typically a serverevent
  let saveEvent = (data) => {
    let event = {
      time: Date.now(),
      data: data
    }
    db.get('events').push(event).write()
  }

  // save a survey
  let saveSurvey = (clientId, data) => {
    let survey = {
      id: clientId,
      time: Date.now(),
      survey: data
    }
    db.get('surveys').push(survey).write()
  }

  let getEvents = () => db.get('events').value()

  // export the log for the admin client
  let getData = () => {
    // generate output-json
    let output = {
      chats: db.get('chat').value(),
      productions: db.get('production').value(),
      trades: db.get('trade').value(),
      inventories: db.get('inventory').value(),
      events: db.get('events').value(),
      surveys: db.get('surveys').value()
    }

    return output
  }

  return {
    saveChat,
    saveProduction,
    saveTrade,
    saveInventory,
    saveMouseOverColony,
    saveEvent,
    saveSurvey,
    getEvents,
    getData
  }
}

export const DatabaseHandler = createDatabaseHandler()
