
import {DatabaseHandler} from './DatabaseHandler'

let createLogger = () => {
  let logChat = (server, clientId, message) => {
    DatabaseHandler.saveChat(clientId, message)
  }

  let logProduction = (server, clientId, index, amount) => {
    DatabaseHandler.saveProduction(clientId, index, amount)
  }

  let logTrade = (server, clientId, receiver, material, amount) => {
    DatabaseHandler.saveTrade(clientId, receiver, material, amount)
  }

  let logInventory = (server, clientId, inventory) => {
    DatabaseHandler.saveInventory(clientId, inventory)
  }

  let logMouseOverColony = (server, clientId, colony) => {
    DatabaseHandler.saveMouseOverColony(clientId, colony)
  }

  let logEvent = (server, data) => {
    server.send('logged', data).toAdmin()
    DatabaseHandler.saveEvent(data)
  }

  let logSurvey = (server, clientId, data) => {
    server.send('logged', clientId + ' completed the survey').toAdmin()
    DatabaseHandler.saveSurvey(clientId, data)
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
    let surveyCSV = 'clientId,time,' + headers.join() + '\n' +
      data.surveys.map(survey =>
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
    let files = {}

    Object.keys(data).filter(logname => logname !== 'surveys').forEach(logName => {
      let log = data[logName]
      if (log.length > 0) {
        files[logName] = Object.keys(log[0]).join() + '\n' +
          log.map(logEntry => Object.values(logEntry).join()).join('\n')
      }
    })
    files['surveys'] = surveyCSV
    return files
  }

  return {
    logChat,
    logProduction,
    logTrade,
    logInventory,
    logMouseOverColony,
    logEvent,
    logSurvey,
    exportAsJSON,
    exportAsCSV
  }
}

export const Logger = createLogger()
