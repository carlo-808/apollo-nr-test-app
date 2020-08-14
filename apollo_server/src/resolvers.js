module.exports = {
	Query: {
		asteroids: (_, { date }, { dataSources }) => 
			dataSources.asteroidAPI.getAsteroidsByDate(date)
	}
};
