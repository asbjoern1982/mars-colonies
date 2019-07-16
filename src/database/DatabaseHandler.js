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
    mouseover: [],
    events: [],
    surveys: []
  }).write()

  // log a chatmessage with who sent it and the message
  let saveChat = (stage, eventId, game, name, clientId, targetName, targetId, message) => {
    let event = {
      stage: stage,
      eventId: eventId,
      game: game,
      name: name,
      id: clientId,
      time: Date.now(),
      timestr: new Date().toLocaleTimeString(),
      targetName: targetName,
      targetId: targetId,
      message: message
    }
    db.get('chat').push(event).write()
  }

  // log that a specialization has been used
  let saveProduction = (stage, eventId, game, name, clientId, index, amount, inputName, outputName, gain) => {
    let event = {
      stage: stage,
      eventId: eventId,
      game: game,
      name: name,
      id: clientId,
      time: Date.now(),
      timestr: new Date().toLocaleTimeString(),
      specializationIndex: index,
      amount: Math.floor(amount),
      inputMaterial: inputName,
      outputMaterial: outputName,
      gain: gain
    }
    db.get('production').push(event).write()
  }

  // log a transfer of materials
  let saveTrade = (stage, eventId, game, name, clientId, receiverName, receiverId, material, amount) => {
    let event = {
      stage: stage,
      eventId: eventId,
      game: game,
      name: name,
      id: clientId,
      time: Date.now(),
      timestr: new Date().toLocaleTimeString(),
      receiverName: receiverName,
      receiverId: receiverId,
      material: material,
      amount: Math.floor(amount)
    }
    db.get('trade').push(event).write()
  }

  // at a certain interval the inventory of a client is logged for redundant storage
  let saveInventory = (stage, eventId, game, name, clientId, eventDescription, eventIdRef, inventory) => {
    let event = {
      stage: stage,
      eventId: eventId,
      game: game,
      name: name,
      id: clientId,
      time: Date.now(),
      timestr: new Date().toLocaleTimeString(),
      eventDescription: eventDescription,
      eventIdRef: eventIdRef
    }
    // add a column for each material
    inventory.forEach(row => event[row.name] = row.amount)
    db.get('inventory').push(event).write()
  }

  // log that a client has moved their mouse over an other colony on the map
  let saveMouseOverColony = (stage, eventId, game, name, clientId, targetName, targetId) => {
    let event = {
      stage: stage,
      eventId: eventId,
      game: game,
      name: name,
      id: clientId,
      time: Date.now(),
      timestr: new Date().toLocaleTimeString(),
      targetName: targetName,
      targetId: targetId
    }
    db.get('mouseover').push(event).write()
  }

  // log any other events, typically a serverevent
  let saveEvent = (stage, eventId, data) => {
    let event = {
      stage: stage,
      eventId: eventId,
      time: Date.now(),
      timestr: new Date().toLocaleTimeString(),
      data: data
    }
    db.get('events').push(event).write()
  }

  // save a survey
  let saveSurvey = (stage, clientId, data) => {
    let survey = {
      stage: stage,
      id: clientId,
      time: Date.now(),
      timestr: new Date().toLocaleTimeString(),
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
      mouseover: db.get('mouseover').value(),
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
