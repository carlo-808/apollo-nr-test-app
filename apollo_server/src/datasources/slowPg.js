const { RESTDataSource } = require('apollo-datasource-rest')

class slowPgAPI extends RESTDataSource {
	constructor() {
		super()
		this.baseURL = 'http://slowpg:7707/'
		this.initialize({})
	}

	async closestAsteroidFound() {
		const response = await this.get('')

		return response
	}
}

module.exports = slowPgAPI
