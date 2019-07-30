const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs')
const dateFormat = require('dateformat')


let createPaymentHandler = () => {
  //let datestr = new Date().toISOString().split('T')[0]
  let datestr = dateFormat(new Date(), 'dd-mm-yyyy')

  let directory = './src/database/payments/'
  if (!fs.existsSync(directory)) fs.mkdirSync(directory)
  let filename = directory + Date.now() + '.csv'
  let selectedRound

  let csvWriter = createCsvWriter({
    path: filename,
    header: [
      {id: 'cprnumber', title: 'Cpr.nr.'},
      {id: 'firstname', title: 'Fornavne'},
      {id: 'lastname', title: 'Efternavn'},
      {id: 'date', title: 'Dato'},
      {id: 'amount', title: 'Beløb'},
    ]
  })

  let participants = []
  let rounds = []

  // save what the participants have earned after a game is over
  // @param participants: {clientId, name, amount}

  let registerScore = (stage, practice, participants) => {
    let round = {
      stage: stage,
      practice: practice,
      participants: participants
    }
    rounds.push(round)
  }

  // to be run when the payment-system starts up to select a random game the participants will get payed for
  let randomizePayout = () => {
    let n = rounds.filter(round => round.practice).length
    selectedRound = rounds[n + Math.floor(Math.random() * (rounds.length - n))].stage
    console.log('selected round: ' + selectedRound)
  }

  let getResults = () => {
    return {
      selectedRound: selectedRound,
      rounds: rounds
    }
  }

  // get the first amount
  /*let getPayout = (clientId) => {
    let participant = participants.find(p => p.clientId === clientId)
    return participant ? participant.amounts[selectedRound] : 0
  }

  let getRounds = (clientId) => {
    let participant = participants.find(p => p.clientId === clientId)
    return participant ? participant.amounts : []
  }*/

  // when a participant has filled in the payment information, save it to the csv file
  let saveParticipantInformation = (clientId, clientData) => {
    // update stored data
    let participant = participants.find(p => p.clientId === clientId)

    // DEBUG: if the participant isnt in the system, the setPayoutAmount hasnt been used but to not lose data, an empty participant is used
    if (!participant) {
      console.log('ISSUE: no participant found when saving information, setPayoutAmount might not have been run')
      participant = {
        clientId: clientId,
        cprnumber: '',
        firstname: '',
        lastname: '',
        date: datestr,
        amounts: ['0']
      }
      participants.push(participant)
    }

    // TODO might need to handle dublication of cpr numbers
    if (participant.cprnumber !== '') {
      console.log('the cpr number has already been saved')
    }

    participant.cprnumber = clientData.cprnumber
    participant.firstname = clientData.firstname
    participant.lastname = clientData.lastname

    let data = [{
      cprnumber: participant.cprnumber.replace('-',''),
      firstname: participant.firstname,
      lastname: participant.lastname,
      date: participant.date,
      amount: ('' + participant.amounts[0]).replace(/\D/g,'').trim()
    }]
    csvWriter
      .writeRecords(data)
      .then(()=> console.log('The CSV file was written successfully'));
  }

  let getFilename = () => {
    return filename
  }

  let exportCSV = (callback) => {
    fs.readFile(filename, (err, buffer) => {
      if (err) {
        console.log('no csv file found')
        callback('')
        return
      }
      callback(buffer.toString())
    })
  }

  return {
    registerScore,
    randomizePayout,
    getResults,
    saveParticipantInformation,
    getFilename,
    exportCSV
  }
}

export const PaymentHandler = createPaymentHandler()
