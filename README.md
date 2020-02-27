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
For running the game with only one browser, there is a argument that will fill in all but one participant with a bot, run
```
npm run bots
```
or
```
node dist/server.js bots
```

## Run on port 8080
To run the game on port 8080 run
```
npm run server
```

## Docker
The game has a [docker file](./Dockerfile), so it is possible to run it on a computer with just docker installed. To get started, make sure docker is installed on the server and git clone the project to the server (or similar like copying it from a usb-drive).
Create an image:
```
docker image build -t mars
```
And run the image as a container:
```
docker container run --publish 3000:3000 --detach --name mars1 mars
```

# configuring the game
To customize the game see [README.config.md](./README.config.md)

# credit for sounds and images
- sounds: [NASA Audio and Ringtones](https://www.nasa.gov/connect/sounds/index.html)
- images: https://en.wikipedia.org/wiki/Mars
