-- Fallback database generation script. Doesn't include outlier filtering or line smoothing.

-- Open the database file for editing.
.open 'report-data.sqlite'

--PRAGMA strict=ON;

-- Set up the schema for the neighborhoods table.
DROP TABLE IF EXISTS neighborhoods;
CREATE TABLE neighborhoods (
	id INT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL
);

-- Set up the schema for the reports table.
DROP TABLE IF EXISTS reports;
CREATE TABLE reports (
	time_of_report INT NOT NULL,
	sewer_and_water REAL,
	power REAL,
	roads_and_bridges REAL,
	medical REAL,
	buildings REAL,
	shake_intensity REAL,
	neighborhood_id INT NOT NULL,
	FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods (id)
);

-- Import data into the database.
.mode csv
.import './neighborhoods.csv' neighborhoods
.import './report-data.csv' reports

UPDATE reports SET sewer_and_water = NULL WHERE sewer_and_water = 'NULL';
UPDATE reports SET power = NULL WHERE power = "NULL";
UPDATE reports SET roads_and_bridges = NULL WHERE roads_and_bridges = "NULL";
UPDATE reports SET medical = NULL WHERE medical = "NULL";
UPDATE reports SET buildings = NULL WHERE buildings = "NULL";
UPDATE reports SET shake_intensity = NULL WHERE shake_intensity = "NULL";

-- Create table of reports grouped by neighborhood and time.
DROP TABLE IF EXISTS grouped_reports;
CREATE TABLE grouped_reports AS SELECT
	time_of_report,
	AVG(sewer_and_water) AS sewer_and_water,
	AVG(power) AS power,
	AVG(roads_and_bridges) AS roads_and_bridges,
	AVG(medical) AS medical,
	AVG(buildings) AS buildings,
	AVG(shake_intensity) AS shake_intensity,
	neighborhood_id
	FROM reports GROUP BY neighborhood_id, time_of_report;
