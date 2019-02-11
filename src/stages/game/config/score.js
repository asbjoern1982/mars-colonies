export default {
  calculateScore: (colony, colonies) => {
    let score = 10 + colony.inventory.filter(row => row.amount > 500).map(row => 2).reduce((total, num) => total + num)
    return score + ' points'
  }
}
