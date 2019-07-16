
import {DatabaseHandler} from './DatabaseHandler'

let createLogger = () => {
  let logChat = (server, eventId, game, name, clientId, targetName, targetId, message) => {
    DatabaseHandler.saveChat(server.getCurrentStage().number, eventId, game, name, clientId, targetName, targetId, message)
  }

  let logProduction = (server, eventId, game, name, clientId, index, amount, inputName, outputName, gain) => {
    DatabaseHandler.saveProduction(server.getCurrentStage().number, eventId, game, name, clientId, index, amount, inputName, outputName, gain)
  }

  let logTrade = (server, eventId, game, name, clientId, receiverName, receiverId, material, amount) => {
    DatabaseHandler.saveTrade(server.getCurrentStage().number, eventId, game, name, clientId, receiverName, receiverId, material, amount)
  }

  let logInventory = (server, eventId, game, name, clientId, eventDescription, eventIdRef, inventory) => {
    DatabaseHandler.saveInventory(server.getCurrentStage().number, eventId, game, name, clientId, eventDescription, eventIdRef, inventory)
  }

  let logMouseOverColony = (server, eventId, game, name, clientId, targetName, targetId) => {
    DatabaseHandler.saveMouseOverColony(server.getCurrentStage().number, eventId, game, name, clientId, targetName, targetId)
  }

  let logEvent = (server, eventId, data) => {
    server.send('logged', data).toAdmin()
    let stage = server.getCurrentStage() ? server.getCurrentStage().number : 'no stage'
    DatabaseHandler.saveEvent(stage, eventId, data)
  }

  let logSurvey = (server, clientId, data) => {
    server.send('logged', clientId + ' completed the survey').toAdmin()
    DatabaseHandler.saveSurvey(server.getCurrentStage().number, clientId, data)
  }

  let exportAsJSON = () => {
    return DatabaseHandler.getData()
  }

  // convert the log to a number of CSV-strings and export them
  let exportAsCSV = () => {
    let data = exportAsJSON()

    // get a list of headers (questions)
    let headers = [...new Set([].concat(...data.surveys.map(survey => Object.keys(survey.survey))))].sort()

    // for each survey, add id, time and questions, if it is not present,
    // it just adds ',' so the columns are presisent and multiple answers are
    // put into quotes
    let surveyCSV = 'stage,clientId,time,timestr' + headers.join() + '\n' +
      data.surveys.map(survey =>
        survey['stage'] + ',' +
        survey['id'] + ',' +
        survey['time'] + ',' +
        survey['timestr'] + ',' +
        headers.map((header) =>
          survey.survey[header]
            ? (Array.isArray(survey.survey[header])
              ? '"' + survey.survey[header].join() + '"'
              : survey.survey[header])
            : ''
        ).join()
      ).join('\n')
    let files = {}

    Object.keys(data).filter(logname => logname !== 'surveys').forEach(logName => {
      let log = data[logName]
      if (log.length > 0) {
        files[logName] = Object.keys(log[0]).join() + '\n' +
          log.map(logEntry =>
            Object.values(logEntry)
              .map(val => val.includes && val.includes(',') ? '"' + val + '"' : val) // surround with " if a comma is present, ei in chat
              .join()
          ).join('\n')
      }
    })
    files['surveys'] = surveyCSV
    return files
  }

  let getEvents = () => DatabaseHandler.getEvents()

  return {
    logChat,
    logProduction,
    logTrade,
    logInventory,
    logMouseOverColony,
    logEvent,
    logSurvey,
    exportAsJSON,
    exportAsCSV,
    getEvents
  }
}

export const Logger = createLogger()
