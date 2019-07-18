let basePayout = 107
let bonus = 50

export default {
  calculateScore: (colony, colonies, inventoryBonusLimit) => {
    return Math.round((basePayout + (colony.dead ? 0 : (colony.inventory.filter(row => row.amount > inventoryBonusLimit).length * bonus)))*100)/100

    // let payout = 107 + colony.dead ? 0 : colony.inventory
    // let score = 10 + colony.inventory.filter(row => row.amount > 500).map(row => 2).reduce((total, num) => total + num)
    /*let score = colony.dead ? 0 : colony.inventory
      .map(row => row.amount)
      .reduce((total, num) => total + num, 0)
    let totalMaterials = colonies.filter(col => !col.dead)
      .map(col => col.inventory)
      .map(inventory => inventory
        .map(row => row.amount)
        .reduce((total, num) => total + num, 0))
      .reduce((total, num) => total + num, 0)
    if (totalMaterials === 0) totalMaterials = 1 // could be zero
    let procent = Math.floor(score / totalMaterials * 100)
    let payout = Math.floor((upperlimit - lowerlimit) * (score / totalMaterials) + lowerlimit)
    return payout + ' kr (' + procent + '%)'*/
  },
  basePayout
}
