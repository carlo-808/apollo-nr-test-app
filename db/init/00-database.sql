\connect roids;

DROP TABLE IF EXISTS favroids;

CREATE TABLE favroids (
    id SERIAL PRIMARY KEY,
    name TEXT,
    roid_id INT,
    createdAt TIMESTAMP,
		updatedAt TIMESTAMP
);