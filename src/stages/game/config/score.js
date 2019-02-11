let upperlimit = 1000
let lowerlimit = 107

export default {
  calculateScore: (colony, colonies) => {
    // let score = 10 + colony.inventory.filter(row => row.amount > 500).map(row => 2).reduce((total, num) => total + num)
    let score = colony.dead ? 0 : colony.inventory
      .map(row => row.amount)
      .reduce((total, num) => total + num)
    let totalMaterials = colonies.filter(col => !col.dead)
      .map(col => col.inventory)
      .map(inventory => inventory
        .map(row => row.amount)
        .reduce((total, num) => total + num))
      .reduce((total, num) => total + num)
    let procent = Math.floor(score / totalMaterials * 100)
    let payout = Math.floor((upperlimit - lowerlimit) * (score / totalMaterials) + lowerlimit)
    return payout + ' kr (' + procent + '%)'
  }
}
