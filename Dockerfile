FROM node:6.0.0-slim

ENV PATH /srv/user-service/node_modules/.bin:$PATH

# use nodemon for development
RUN npm install --global nodemon

WORKDIR /srv/user-service

# Install node modules (allows for npm install to be cached until package.json changes).
COPY package.json ./
RUN npm install

# Whitelist copy needed files over to build context.
COPY src src
COPY server.js ./
COPY user-service.proto ./

EXPOSE 3000

# Using a command here so that it can be overwritten in the docker-compose.yml.
CMD ["node", "server.js"]
