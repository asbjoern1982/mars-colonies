import config from './config.json'

let basePayout = 60
let maximumPayout = 160
let bonus = 33

export default {
  calculateScore: (colony, colonies) => {
    let payout = basePayout + (colony.dead ? 0 : (colony.inventory.filter(row => row.amount > config.inventoryBonusLimit).length * bonus))
    return  Math.min(payout, maximumPayout)
  },
  basePayout
}
