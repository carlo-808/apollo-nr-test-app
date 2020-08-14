'use strict'
require('newrelic')

const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const AsteroidAPI = require('./datasources/astroid')

const server = new ApolloServer({ 
	typeDefs,
	resolvers,
  dataSources: () => ({
		asteroidAPI: new AsteroidAPI()
	}),
	context: () => {
		return {
			token: process.env.NASA_API_KEY
		}
	}
 });

server.listen().then(({url}) => {
	console.log(`🚀 Server ready at ${url}`);
})