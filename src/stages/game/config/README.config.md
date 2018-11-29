"participants": a number of expected participants in the game, it should be diviable by the number of "players"
"materials": a list of materials and their depletion_rate in this game
"roundLengthInSeconds": the length of a game, 1200 would be 20 minutes

"inventoryBonusLimit": the bonus threashold, when calculating points for materials, being over this limit will yeld bonus points
"inventoryCriticalLimit": when a player should get a visual cue about a low inventory, ei blinking red text
"chat": how the chat is configured, can be either "none" for off, "free" for free communication and an array of allowed sentences ["yes", "no", "maybe later"]
"tooltip": an array with what information should be visible in the tooltip when a participant hovers the mouse over an other colony on the map, can either be empty, "inventories" and/or "specilisations"
"trade_delay": if their should be a delay when trading materials to other colonies

"players": a list of colonies, their name, starting inventory and specilisations
