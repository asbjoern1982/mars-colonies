To configure a game the server needs to know a couple of things:

## Stages
In [src/serverStages.js](./src/serverStages.js) the server is configured
`participants`, the number of participants in the experiment, it is set in where the server is created.
`stages`, a list of stages that the game is going through, a lobby before, couple of surveys and a number of games with different configurations. It has to be mirrored in [src/clientStages.js](./src/clientStages.js) with a slightly different syntax.

## Score
How the points are calculated it configured in [src/configurations/score.js](./src/configurations/score.js)

## Survey
It takes json created with [Survey Creator](https://surveyjs.io/create-survey), it should be saved in [src/configurations/](./src/configurations/) and setup as a stage in [src/serverStages.js](./src/serverStages.js).

## Configuration of the games
The configuration of each round set in the `serverStages.js` file is configured with a json file.

| Key | Description |
| --- | --- |
| materials | a list with materials with a `name` and a `depletion_rate` that determents how fast the materials ... depletes in seconds |
| practiceRun | boolean with if true will ignore the round in point calculations |
| soundVolume | is the volume of the background music and notifications, from 0 to 1, 0 removes sound completely |
| shuffleParticipants | boolean that the tells to server to shuffle participants and colonys before a round |
| roundLengthInSeconds | the length of a game, 1200 would be 20 minutes |
| inventoryBonusLimit | the bonus threshold, when calculating points for materials, being over this limit will yeld bonus points |
| inventoryCriticalLimit | when a player should get a visual cue about a low inventory, for example blinking red text |
| chat | how the chat is configured, can be either "none" for off, `"free"` for free communication and an array of allowed sentences `["yes", "no", "maybe later"]` |
| allowDirectMessages | boolean that allows or removes the direct message system between colonies |
| tooltip | an array with what information should be visible in the tooltip when a participant hovers the mouse over an other colony on the map, can either be empty, "inventories", "score" and/or "specializations" |
| trade_delay | if their should be a delay when trading materials to other colonies |
| productionAmounts | optional, an array of amounts that the participant can chose to produce, if absent a textfield and start button will be used |
| sendAmounts | optional, an array of amounts that the participant can chose to send, if absent a textfield and start button will be used |
| players | a list of colonies, their name, starting inventory and specializations, if there are more than 15 colonies, then more colors should be added to the client.js <ul><li> name: is the name of a colony, should be unique for a game</li><li> inventory: should have every material in "materials" and the amount this colony is starting out with </li><li> specializations: a list of specializations, the ability to transform one material into an other with a gain </li><li> coordinates: optional, if set, the give colony is placed on that spot on the map, if not set, the other colonies will be placed on a circle around one self</li></ul> |
