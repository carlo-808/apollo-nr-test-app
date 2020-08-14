const { RESTDataSource } = require('apollo-datasource-rest')

class AsteroidAPI extends RESTDataSource {
	constructor() {
		super()
		this.baseURL = 'https://api.nasa.gov/neo/rest/v1/feed'
	}

	async getAsteroidsByDate(date) {
		const path = `?start_date=${date}&end_date=${date}`
		const response = await this.get(path)

		const roids = response.near_earth_objects[date]

		const data = Object.keys(roids).map(key => roids[key])

		return data.map(asteroid => this.asteroidReducer(asteroid))
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
			estimated_diameter_meters_max: est_diameter.meters.estimated_diameter_max,
			estimated_diameter_meters_min: est_diameter.meters.estimated_diameter_min,
			miss_distance_km: approach_data.miss_distance.kilometers,
			relative_velocity_km_per_hour: approach_data.relative_velocity.kilometers_per_hour,
			close_approach_date: approach_data.close_approach_date,
			is_potentially_hazardous: asteroid.is_potentially_hazardous
		}
	}
}

module.exports = AsteroidAPI
