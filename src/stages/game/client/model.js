let createModel = () => {
  let myMaterials
  let myThisColony
  let myOtherColonies

  let setup = (data) => {
    myMaterials = data.materials
    myThisColony = data.colonies.find(colony => colony.name === data.yourName)
    myThisColony.specilisations = data.yourSpecilisations
    myThisColony.inventory = data.yourStartingInventory
    myOtherColonies = data.colonies.filter(colony => colony.name !== data.yourName)
  }

  let thisColony = () => myThisColony
  let materials = () => myMaterials
  let otherColonies = () => myOtherColonies

  return {
    setup,
    materials,
    thisColony,
    otherColonies
  }
}

export let Model = createModel()
