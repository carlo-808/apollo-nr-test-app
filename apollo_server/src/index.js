'use strict'
require('newrelic')

const { ApolloServer } = require('apollo-server')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const Sequelize = require('sequelize')

const AsteroidAPI = require('./datasources/astroid')
const roidModel = require('./datasources/persistModel')
const sequelize = new Sequelize(process.env.DATABASE_URL)
sequelize.sync()
roidModel(sequelize, Sequelize.DataTypes)

const models = sequelize.models

const server = new ApolloServer({ 
	typeDefs,
	resolvers,
  dataSources: () => ({
		asteroidAPI: new AsteroidAPI(),
		models
	}),
	context: () => {
		return {
			token: process.env.NASA_API_KEY
		}
	}
 })

server.listen().then(({url}) => {
	console.log(`🚀 Server ready at ${url}`)
})