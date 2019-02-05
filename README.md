# mars-colonies
Mars Colonies

# How to run the game
Run the following commands in the folder
```
npm install
npm run build
```
Note: on linux this is not working correctly and has to be escaped when it is done building (**ctrl+c**)
run `node dist/server.js`
Open `localhost:3000` in 3 different sessions, I use chrome, chrome window in incognito and firefox.

## Bots
to run the game with bots use
```
npm run bots
```
or
```
npm node dist/server.js bots
```

## Run on port 8080
To run the game on port 8080 run
```
npm run server
```

# configuring the game
`numberOfParticipants` in the `src/stages/game/config/config.js` tells the game how many participants to wait for before stating the first stage, it should be a number that can be divided by the number of colonies in each game

see [README.config.md](./src/stages/game/config/README.config.md)

# credit for sounds and images
sounds: https://www.nasa.gov/connect/sounds/index.html
images: https://en.wikipedia.org/wiki/Mars
