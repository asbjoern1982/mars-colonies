const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

let createDatabaseHandler = () => {
  const adapter = new FileSync('./src/database/db.json')
  const db = low(adapter)
  db.defaults({events: []}).write()

  let logEvent = (clientId, data) => {
    let event = {
      id: clientId,
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
    logEvent,
    exportAsJSON
  }
}

export const DatabaseHandler = createDatabaseHandler()
