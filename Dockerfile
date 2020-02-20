FROM node:13
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]

# To build and run Mars Colonies with mars:
# docker image build -t mars .
# docker container run --publish 3000:3000 mars
