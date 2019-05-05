.open 'report-data.sqlite'

DROP TABLE IF EXISTS neighborhoods;
CREATE TABLE neighborhoods (
	id INT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL
);

DROP TABLE IF EXISTS reports;
CREATE TABLE reports (
	time_of_report TEXT NOT NULL,
	sewer_and_water INT,
	power INT,
	roads_and_bridges INT,
	medical INT,
	buildings INT,
	shake_intensity INT,
	neighborhood_id INT NOT NULL,
	FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods (id)
);

.mode csv
.import './neighborhoods.csv' neighborhoods
.import './mc1-reports-data.csv' reports
