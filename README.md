# mars-colonies
Mars Colonies

# How to run the game
run "npm install"
run "npm run build" (on linux this is not working correctly and has to be escaped when it is done)
run "node dist/server.js"
Open "localhost:3000" in 3 different sessions, I use chrome, chrome window in incognito and firefox.

# configuring the game
<code>numberOfParticipants</code> in the src/stages/game/config/config.js tells the game how many participants to wait for before stating the first stage, it should be a number that can be devided by the number of colonies in each game
## Bots for debugging
In the root server.js the number of bots can be set, should be 0 if not debugging.<br>
<code>let numberOfBots = 0</code><br><br>
For fast getting the game up and running with only 1 client<br>
<code>let numberOfBots = config.participants - 1</code>
