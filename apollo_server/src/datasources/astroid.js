const { RESTDataSource } = require('apollo-datasource-rest')

const toNumber = (value) => Number.parseFloat(value).toFixed(2)

class AsteroidAPI extends RESTDataSource {
	constructor(roidModel) {
		super()
		this.baseURL = 'https://api.nasa.gov/neo/rest/v1/feed'
		this.roidModel = roidModel
	}

	async getAsteroidsByDate(date) {
		const path = `?start_date=${date}&end_date=${date}`
		const response = await this.get(path)

		const roids = response.near_earth_objects[date]

		const data = Object.keys(roids).map(key => roids[key])

		return data.map(asteroid => this.asteroidReducer(asteroid))
	}

	async getClosestAsteroidByDate(date) {
		const data = await this.getAsteroidsByDate(date)

		let closestAsteroid

		data.forEach((x) => {
			if (closestAsteroid === undefined ||
				Number(x.miss_distance_km) < Number(closestAsteroid.miss_distance_km)) {
					closestAsteroid = x
			}
		})

		// TODO: make this idempotent
		this.roidModel.Favroids.create({
			name: closestAsteroid.name,
			roid_id: closestAsteroid.id, asteroiddata: closestAsteroid })

		return closestAsteroid

		// const asteroid = data.reduce((acc, asteroid) => {
		// 	return (acc.miss_distance_km === undefined ||
		// 		Number(asteroid.miss_distance_km) < Number(acc.miss_distance_km)) ?
		// 		asteroid : acc
		// }, {})

		// return asteroid
	}

	willSendRequest(request) {
		request.params.set('api_key', this.context.token)
	}

	asteroidReducer(asteroid) {
		const approach_data = asteroid.close_approach_data[0]
		const est_diameter = asteroid.estimated_diameter
		return {
			id: asteroid.id,
			name: asteroid.name,
			estimated_diameter_meters_max: toNumber(est_diameter.meters.estimated_diameter_max),
			estimated_diameter_meters_min: toNumber(est_diameter.meters.estimated_diameter_min),
			miss_distance_km: toNumber(approach_data.miss_distance.kilometers),
			relative_velocity_km_per_hour: toNumber(approach_data.relative_velocity.kilometers_per_hour),
			close_approach_date: approach_data.close_approach_date,
			is_potentially_hazardous: asteroid.is_potentially_hazardous
		}
	}
}

module.exports = AsteroidAPI
