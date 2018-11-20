const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

let createDatabaseHandler = () => {
  const adapter = new FileSync('./src/database/db.json')
  const db = low(adapter)
  db.defaults({
    chat: [],
    production: [],
    trade: [],
    inventory: [],
    logMouseOverColony: [],
    events: []
  }).write()

  let logChat = (clientId, message) => {
    let event = {
      id: clientId,
      time: Date.now(),
      message: message
    }
    db.get('chat').push(event).write()
  }

  let logProduction = (clientId, material, amount) => {
    let event = {
      id: clientId,
      time: Date.now(),
      material: material,
      amount: Math.floor(amount)
    }
    db.get('production').push(event).write()
  }

  let logTrade = (clientId, receiver, material, amount) => {
    let event = {
      id: clientId,
      time: Date.now(),
      receiver: receiver,
      material: material,
      amount: Math.floor(amount)
    }
    db.get('trade').push(event).write()
  }

  let logInventory = (clientId, inventory) => {
    let event = {
      id: clientId,
      time: Date.now(),
      inventory: inventory
    }
    db.get('inventory').push(event).write()
  }

  let logMouseOverColony = (clientId, colony) => {
    let event = {
      id: clientId,
      time: Date.now(),
      colony: colony
    }
    db.get('logMouseOverColony').push(event).write()
  }

  let logEvent = (data) => {
    let event = {
      time: Date.now(),
      data: data
    }
    db.get('events').push(event).write()
  }

  let exportAsJSON = () => {
    let surveys = db.get('events').value()
    return surveys
  }

  return {
    logChat,
    logProduction,
    logTrade,
    logInventory,
    logMouseOverColony,
    logEvent,
    exportAsJSON
  }
}

export const DatabaseHandler = createDatabaseHandler()
