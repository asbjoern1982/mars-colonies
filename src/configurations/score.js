let basePayout = 0

export default {
  calculateScore: (colony, colonies, inventoryBonusLimit) => {
    //let payout = basePayout + (colony.dead ? 0 : (colony.inventory.filter(row => row.amount > inventoryBonusLimit).length * bonus))
    if (colony.dead) {
      return "død (0)"
    }
    let score = parseInt(colony.inventory.reduce((sum, row) => sum + row.amount, 0))
    if (colony.inventory.every(row => row.amount > 1000)) {
      return "superoverlever (" + score + ")"
    }
    if (colony.inventory.any(row => row.amount < 50)) {
      return "næsten død (" + score + ")"
    }
    return "overlever (" + score + ")"
  },
  basePayout
}
