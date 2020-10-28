\connect roids;

DROP TABLE IF EXISTS favroids;

CREATE TABLE favroids (
    id SERIAL PRIMARY KEY,
    name TEXT,
    roid_id INT,
    asteroiddata JSON,
    createdAt TIMESTAMP,
		updatedAt TIMESTAMP
);