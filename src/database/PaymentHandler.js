const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs')
const dateFormat = require('dateformat')


let createPaymentHandler = () => {
  //let datestr = new Date().toISOString().split('T')[0]
  let datestr = dateFormat(new Date(), 'dd-mm-yyyy')

  let directory = './src/database/payments/'
  if (!fs.existsSync(directory)) fs.mkdirSync(directory)
  let filename = directory + Date.now() + '.csv'

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

  // save what the participants have earned after a game is over
  // @param data: {clientId, amount}
  let setPayoutAmount = (tokens) => {
    console.log('setPayoutAmount: ' + tokens)

    tokens.forEach(token => {
      let participant = participants.find(p => p.clientId === token.clientId)
      if (!participant) {
        participant = {
          clientId: token.clientId,
          cprnumber: '',
          firstname: '',
          lastname: '',
          date: datestr,
          amounts: [token.amount]
        }
        participants.push(participant)
      } else {
        participant.amounts.push(token.amount)
      }
    })
  }

  // to be run when the payment-system starts up to select a random game the participants will get payed for
  let randomizePayout = () => {
    if (participants.length > 0) {
      // pick a random game
      let gameIndex = Math.floor(Math.random() * participants[0].amounts.length)
      console.log('Chosen game ' + gameIndex + ' out of ' + participants[0].amounts.length + ' games')
      // put the payout for that game in front
      participants.forEach(p => {
        let temp = p.amounts[0]
        p.amounts[0] = p.amounts[gameIndex]
        p.amounts[gameIndex] = temp
      })
    }
  }

  // get the first amount
  let getPayout = (clientId) => {
    let participant = participants.find(p => p.clientId === clientId)
    return participant ? participant.amounts[0] : 0
  }

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
    setPayoutAmount,
    randomizePayout,
    getPayout,
    saveParticipantInformation,
    exportCSV
  }
}

export const PaymentHandler = createPaymentHandler()
