import {DatabaseHandler} from './DatabaseHandler'
import {PaymentHandler} from './PaymentHandler'
const fs = require('fs')

let createLogger = () => {

  let directoryCSV = './src/database/csv/'
  if (!fs.existsSync(directoryCSV)) fs.mkdirSync(directoryCSV)
  let experimentDir = './src/database/csv/experiment' + Date.now() + '/'
  if (!fs.existsSync(experimentDir)) fs.mkdirSync(experimentDir)

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

    let surveyStages = [...new Set(data.surveys.map(survey => survey.stage))]
    //console.log('number of surveys: ' + surveyStages.join())


    let files = {}
    surveyStages.forEach(surveyStage => {
      files['survey' + surveyStage] = convertSurvey(data.surveys.filter(survey => survey.stage === surveyStage))
    })

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
    //files['surveys'] = surveyCSV
    return files
  }

  let convertSurvey = (surveys) => {
      // get a list of headers (questions)
      let headers = [...new Set([].concat(...surveys.map(survey => Object.keys(survey.survey))))].sort()

      // for each survey, add id, time and questions, if it is not present,
      // it just adds ',' so the columns are presisent and multiple answers are
      // put into quotes
      let surveyCSV = 'stage,clientId,time,timestr,' + headers.join() + '\n' +
        surveys.map(survey =>
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

      return surveyCSV
  }


  let saveSurveyCSV = (stage) => {
    let data = exportAsJSON()
    let csv = convertSurvey(data.surveys.filter(survey => survey.stage === stage))

    // create a directory for this stage
    let stageDir = experimentDir + 'stage' + stage + '/'
    if (!fs.existsSync(stageDir)) fs.mkdirSync(stageDir)

    // save to file
    fs.writeFile(stageDir + 'stage' + stage + '_survey.csv', csv, (err) => {
      if (err) throw err
      console.log('survey-csv file saved for stage ' + stage)
    })
  }

  let saveGameCSV = (stage) => {
    let data = exportAsJSON()

    let files = {}
    Object.keys(data).filter(logname => logname !== 'surveys').forEach(logName => {
      let log = data[logName].filter(log => log.stage === stage)
      if (log.length > 0) {
        files[logName] = Object.keys(log[0]).join() + '\n' +
          log.map(logEntry =>
            Object.values(logEntry)
              .map(val => val.includes && val.includes(',') ? '"' + val + '"' : val) // surround with " if a comma is present, ei in chat
              .join()
          ).join('\n')
      }
    })

    // create a directory for this stage
    let stageDir = experimentDir + 'stage' + stage + '/'
    if (!fs.existsSync(stageDir)) fs.mkdirSync(stageDir)

    // save files
    Object.keys(files).forEach(name => {
      fs.writeFile(stageDir + 'stage' + stage + '_' + name + '.csv', files[name], (err) => {
        if (err) throw err
        console.log('game-csv files saved for stage ' + stage)
      })
    })

  }

  let savePaymentCSV = (stage) => {
    let filename = PaymentHandler.getFilename()

    let stageDir = experimentDir + 'stage' + stage + '/'
    if (!fs.existsSync(stageDir)) fs.mkdirSync(stageDir)

    fs.copyFile(filename, stageDir + 'stage' + stage + '_payment.csv', (err) => {
      if (err) throw err;
      console.log('payment-csv file saved for stage ' + stage);
    })
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
    saveSurveyCSV,
    saveGameCSV,
    savePaymentCSV,
    getEvents
  }
}

export const Logger = createLogger()
