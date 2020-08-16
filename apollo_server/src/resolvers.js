module.exports = {
	Query: {
		asteroids: async (_, { date }, { dataSources }) => 
			await dataSources.asteroidAPI.getAsteroidsByDate(date),
		roids: async (_, __, { dataSources }) => 
			await dataSources.models.Favroids.findAll({
				attributes: [
					'id',
					'name',
					'roid_id'
				]
			})
	},
	Mutation: {
		addAsteroid: async (_, { name, roid_id }, { dataSources }) => {
			const roid = await dataSources.models.Favroids.create({ name: name, roid_id: roid_id })
			return roid
		}
	}
}
