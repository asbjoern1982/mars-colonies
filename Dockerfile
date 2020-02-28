FROM node:12
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
# as parcel is poorly supported the build stops after the first is finished so
# the client and adminclient is nevery compiled. This is a workaround, just wait
# some time before connecting to let the build finish
# CMD ["node", "dist/server.js"]

# To build and run Mars Colonies with mars:
# docker image build -t mars .
# docker container run --publish 3000:3000 mars
