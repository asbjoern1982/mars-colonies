let createModel = () => {
  let materials
  let colony
  let otherColonies

  let setup = (data) => {
    materials = data.materials
    colony = data.colonies.find(colony => colony.name === data.yourName)
    colony.specilisations = data.yourSpecilisations
    colony.inventory = data.yourStartingInventory
    otherColonies = data.colonies.filter(colony => colony.name !== data.yourName)
  }

  let getMaterials = () => materials
  let getColony = () => colony
  let getOtherColonies = () => otherColonies

  return {
    setup,
    getMaterials,
    getColony,
    getOtherColonies
  }
}

export let Model = createModel()
