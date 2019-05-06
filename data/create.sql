.open 'report-data.sqlite'

-- Set up the schema for the neighborhoods table.
DROP TABLE IF EXISTS neighborhoods;
CREATE TABLE neighborhoods (
	id INT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL
);

-- Set up the schema for the reports table.
DROP TABLE IF EXISTS reports;
CREATE TABLE reports (
	time_of_report INT NULL,
	sewer_and_water REAL,
	power REAL,
	roads_and_bridges REAL,
	medical REAL,
	buildings REAL,
	shake_intensity REAL,
	neighborhood_id INT NOT NULL,
	FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods (id)
);

-- Set up index to speed up queries based on report date.
DROP INDEX IF EXISTS dates;
--CREATE INDEX dates ON reports(time_of_report);

PRAGMA cache_size = -10000;

-- Import data into the database.
.mode csv
.import './neighborhoods.csv' neighborhoods
.import './report-data.csv' reports
