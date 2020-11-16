FROM node:alpine
WORKDIR /usr/src/app
COPY package.*json /usr/src/app
# COPY node_modules /usr/src/app/node_modules
RUN npm install
EXPOSE 4000
ENTRYPOINT ["npm", "start"]