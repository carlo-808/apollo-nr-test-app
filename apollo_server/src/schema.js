const { gql } = require('apollo-server')

const typeDefs = gql`
  # Schema
  type Asteroid {
    id: ID!,
    name: String,
    estimated_diameter_meters_max: Float,
    estimated_diameter_meters_min: Float,
    miss_distance_km: Float,
    relative_velocity_km_per_hour: Float,
    close_approach_date: String,
    is_potentially_hazardous: Boolean
  }

  type Roid {
    id: ID!
    name: String!
    roid_id: Int!
  }

  type Query {
    asteroids(date: String!): [Asteroid]!
    roids: [Roid]!
  }

  type Mutation {
    addAsteroid(name: String!, roid_id: Int!) : Roid!
  }
`

module.exports = typeDefs
