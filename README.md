## Apollo New Relic Test App

This app adds a GraphQL interface to the NASA Near Earth Objects API.

You can create a local `.env` file with these variable values:

- NEW_RELIC_HOST
- NEW_RELIC_LICENSE_KEY
- NEW_RELIC_INFINITE_TRACING_TRACE_OBSERVER_HOST
- NASA_API_KEY

More info on the `.env` format [here](https://docs.docker.com/compose/env-file/).

You can generate a `NASA_API_KEY` [here](https://api.nasa.gov/)

OR

use `DEMO_KEY` as the `NASA_API_KEY` value which limits the number of calls you can make.

run: `docker-compose up` at the root dir and the apollo server will be accessible at `http://locahost:4000`

example query:
```
query GetRoids {
  asteroids(date: "2020-08-12") {
    id,
    name,
    miss_distance_km,
    close_approach_date,
    relative_velocity_km_per_hour,
  }
}
```