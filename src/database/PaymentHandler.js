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

  // data: {clientId, amount}
  let setPayoutAmount = (data) => {
    console.log('setPayoutAmount: ' + data)
    participants = data.map(p => {
      let participant = {
        clientId: p.clientId,
        cprnumber: '',
        firstname: '',
        lastname: '',
        date: datestr,
        amount: p.amount
      }
      return participant
    })
  }

  let getPayout = (clientId) => {
    let participant = participants.find(p => p.clientId === clientId)
    return participant ? participant.amount : 0
  }

  let saveParticipantInformation = (clientId, clientData) => {
    // update stored data
    let participant = participants.find(p => p.clientId === clientId)

    // DEBUG: if the participant isnt in the system, the setPayoutAmount hasnt been used but to not lose data, an empty participant is used
    if (!participant) { // DEBUG: just for testing
      console.log('ISSUE: no participant found when saving information, setPayoutAmount might not have been run')
      participant = {
        clientId: clientId,
        cprnumber: '',
        firstname: '',
        lastname: '',
        date: datestr,
        amount: '0'
      }
      participants.push(participant)
    }

    participant.cprnumber = clientData.cprnumber
    participant.firstname = clientData.firstname
    participant.lastname = clientData.lastname

    let data = [{
      cprnumber: participant.cprnumber.replace('-',''),
      firstname: participant.firstname,
      lastname: participant.lastname,
      date: participant.date,
      amount: ('' + participant.amount).replace(/\D/g,'').trim()
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
    getPayout,
    saveParticipantInformation,
    exportCSV
  }
}

export const PaymentHandler = createPaymentHandler()
