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
  let logChat = (clientId, message) => {
    let event = {
      id: clientId,
      time: Date.now(),
      message: message
    }
    db.get('chat').push(event).write()
  }

  // log that a specilisation has been used
  let logProduction = (clientId, material, amount) => {
    let event = {
      id: clientId,
      time: Date.now(),
      material: material,
      amount: Math.floor(amount)
    }
    db.get('production').push(event).write()
  }

  // log a transfer of materials
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

  // at a certain interval the inventory of a client is logged for redundant storage
  let logInventory = (clientId, inventory) => {
    let event = {
      id: clientId,
      time: Date.now(),
      inventory: inventory
    }
    db.get('inventory').push(event).write()
  }

  // log that a client has moved their mouse over an other colony on the map
  let logMouseOverColony = (clientId, colony) => {
    let event = {
      id: clientId,
      time: Date.now(),
      colony: colony
    }
    db.get('logMouseOverColony').push(event).write()
  }

  // log any other events, typically a serverevent
  let logEvent = (data) => {
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

  // export the log for the admin client
  let exportAsJSON = () => {
    let surveys = db.get('surveys').value()
    // get a list of headers (questions)
    let headers = [...new Set([].concat(...surveys.map(survey => Object.keys(survey.survey))))].sort()

    // for each survey, add id, time and questions, if it is not present,
    // it just adds ',' so the columns are presisent and multiple answers are
    // put into quotes
    surveyCSV = 'clientId,time,' + headers.join() + '\n' +
      surveys.map(survey =>
        survey['id'] + ',' +
        survey['time'] + ',' +
        headers.map((header) =>
          survey.survey[header]
            ? (Array.isArray(survey.survey[header])
              ? '"' + survey.survey[header].join() + '"'
              : survey.survey[header])
            : ''
        ).join()
      ).join('\n')

    // generate output-json
    let output = {
      chats: db.get('chat').value(),
      productions: db.get('production').value(),
      trades: db.get('trade').value(),
      inventories: db.get('inventory').value(),
      events: db.get('events').value(),
      surveys: surveyCSV
    }

    return output
  }

  // convert the log to a number of CSV-strings and export them
  let exportAsCSV = () => {
    let data = exportAsJSON()
    let files = {}
    Object.keys(data).forEach(logName => {
      let log = data[logName]
      if (log.length > 0) {
        files[logName] = Object.keys(log[0]).join() + '\n' +
          log.map(logEntry => Object.values(logEntry).join()).join('\n')
      }
    })
    return files
  }

  return {
    logChat,
    logProduction,
    logTrade,
    logInventory,
    logMouseOverColony,
    logEvent,
    saveSurvey,
    exportAsJSON,
    exportAsCSV
  }
}

export const DatabaseHandler = createDatabaseHandler()
