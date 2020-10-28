'use strict'

require('newrelic')

const express = require('express')
const app = express()
const PORT = 7707

const Sequelize = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL)
sequelize.sync()

// Setup model
const Favroids = sequelize.define('Favroids', {
	name: Sequelize.DataTypes.STRING,
	roid_id: Sequelize.DataTypes.INTEGER,
	asteroiddata: Sequelize.DataTypes.JSON
}, {
	tableName: 'favroids',
	timestamps: false
})

const getClosestAsteroidSoFar = (data) => {
	let closestAsteroid

	data.forEach((x) => {
		if(x.dataValues.asteroiddata !== null && x.dataValues.asteroiddata.miss_distance_km) {
			if (closestAsteroid === undefined || 
				Number(x.dataValues.asteroiddata.miss_distance_km) < Number(closestAsteroid.asteroiddata.miss_distance_km)) {
					closestAsteroid = x.dataValues
			}
		}
	})

		return closestAsteroid.asteroiddata || {}
}

app.get('/', async (req, res) => {
	try {
		const data = await Favroids.findAll()

		setTimeout(() => {
			const closestRoid = getClosestAsteroidSoFar(data)
			res.json(closestRoid)
		}, 1500)
	} catch (error) {
		console.log(error)
		res.send(500)
	}
})

app.listen(PORT)

console.log(`slow pg service running on http://localhost:${PORT}`)
