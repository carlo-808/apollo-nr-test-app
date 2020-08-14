FROM node:alpine
WORKDIR /usr/src/app
COPY package.*json /usr/src/app
RUN npm install
EXPOSE 4000
ENTRYPOINT ["npm", "start"]