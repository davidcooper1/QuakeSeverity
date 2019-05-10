import sqlite3
import math
import csv
import time

# Implementation of STDEV for sqlite3 module to use.
# http://alexforencich.com/wiki/en/scripts/python/stdev
class StdevFunc:
    def __init__(self):
        self.M = 0.0
        self.S = 0.0
        self.k = 1

    def step(self, value):
        if value is None:
            return
        tM = self.M
        self.M += (value - tM) / self.k
        self.S += (value - tM) * (value - self.M)
        self.k += 1

    def finalize(self):
        if self.k < 3:
            return None
        return math.sqrt(self.S / (self.k-2))

# Open the database connection.
connection = sqlite3.connect("report-data.sqlite")
connection.create_aggregate("stdev", 1, StdevFunc)

c = connection.cursor()

# Creates empty neighborhoods table.
c.execute("DROP TABLE IF EXISTS neighborhoods")
c.execute("""
    CREATE TABLE neighborhoods (
        id INT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL
    )
""")

# Creates empty reports table.
c.execute("DROP TABLE IF EXISTS reports")
c.execute("""
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
    )
""")

# Populates neighborhoods table from csv.
with open("neighborhoods.csv", "r") as neighborhoodsFile :
    neighborhoods = csv.reader(neighborhoodsFile)
    for neighborhood in neighborhoods :
        c.execute(
            "INSERT INTO neighborhoods VALUES (?, ?)",
            [int(neighborhood[0]), neighborhood[1]]
        )

# Populates reports table from csv.
with open("report-data.csv", "r") as reportsFile :
    reports = csv.reader(reportsFile)
    for report in reports :
        c.execute(
            "INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                int(report[0]),
                None if report[1] == "NULL" else float(report[1]),
                None if report[2] == "NULL" else float(report[2]),
                None if report[3] == "NULL" else float(report[3]),
                None if report[4] == "NULL" else float(report[4]),
                None if report[5] == "NULL" else float(report[5]),
                None if report[6] == "NULL" else float(report[6]),
                int(report[7])
            ]
        )

# Create ranges table to store outlier ranges for each (neighborhood_id, time_of_report) combination.
c.execute("""
    CREATE TABLE ranges AS SELECT
        time_of_report,
        AVG(sewer_and_water) + STDEV(sewer_and_water) AS high_sewer_and_water,
        AVG(sewer_and_water) - STDEV(sewer_and_water) AS low_sewer_and_water,
        AVG(power) + STDEV(power) AS high_power,
        AVG(power) - STDEV(power) AS low_power,
        AVG(roads_and_bridges) + STDEV(roads_and_bridges) AS high_roads_and_bridges,
        AVG(roads_and_bridges) - STDEV(roads_and_bridges) AS low_roads_and_bridges,
        AVG(medical) + STDEV(medical) AS high_medical,
        AVG(medical) - STDEV(medical) AS low_medical,
        AVG(buildings) + STDEV(buildings) AS high_buildings,
        AVG(buildings) - STDEV(buildings) AS low_buildings,
        AVG(shake_intensity) + STDEV(shake_intensity) AS high_shake_intensity,
        AVG(shake_intensity) - STDEV(shake_intensity) AS low_shake_intensity,
        neighborhood_id
        FROM reports GROUP BY neighborhood_id, time_of_report
""")

# Create indices for range and report tables to speed up filtering.
c.execute("CREATE UNIQUE INDEX range_times ON ranges(neighborhood_id, time_of_report)")
c.execute("CREATE INDEX report_times ON reports(neighborhood_id, time_of_report)")

# Query format string for filtering.
outlierFilterString = """
    UPDATE reports SET {0} = NULL
        WHERE {0} > (
            SELECT high_{0} FROM ranges
                WHERE ranges.time_of_report = reports.time_of_report AND
                    ranges.neighborhood_id = reports.neighborhood_id
        ) OR {0} < (
            SELECT low_{0} FROM ranges
                WHERE ranges.time_of_report = reports.time_of_report AND
                    ranges.neighborhood_id = reports.neighborhood_id
        )
"""

# Categories to pass to filter string.
categories = ["sewer_and_water", "power", "roads_and_bridges", "medical", "buildings", "shake_intensity"]

# Filters out outliers in each category.
for category in categories :
    print("Removing {0} outliers... ".format(category), flush=True, end="")
    start = time.time()
    c.execute(outlierFilterString.format(category))
    end = time.time()
    print(round(end - start, 2), "s", sep="", flush=True)

# Delete the indices and ranges table now that filtering has been done.
c.execute("DROP INDEX range_times")
c.execute("DROP INDEX report_times")
c.execute("DROP TABLE ranges")

# Create table to store averages of each (neighborhood_id, time_of_report) combination.
c.execute("DROP TABLE IF EXISTS grouped_reports")
c.execute("""
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
""");

# Create table to store smoothed intensity data.
c.execute("DROP TABLE IF EXISTS avg_reports")
c.execute("CREATE TABLE avg_reports AS SELECT * FROM grouped_reports")

avgString = """
    UPDATE avg_reports SET {0}= (
        SELECT AVG({0}) FROM grouped_reports AS others
            WHERE others.neighborhood_id = avg_reports.neighborhood_id
                AND others.time_of_report < avg_reports.time_of_report + 1800000
                AND others.time_of_report > avg_reports.time_of_report - 1800000
    )
"""

c.execute("DROP INDEX IF EXISTS group_times");
c.execute("DROP INDEX IF EXISTS avg_times");
c.execute("CREATE UNIQUE INDEX group_times ON grouped_reports(neighborhood_id, time_of_report)")
c.execute("CREATE UNIQUE INDEX avg_times ON avg_reports(neighborhood_id, time_of_report)")

for category in categories :
    print("Curving {0} outliers... ".format(category), flush=True, end="")
    start = time.time()
    c.execute(avgString.format(category))
    end = time.time()
    print(round(end - start, 2), "s", sep="", flush=True)

connection.commit()
connection.close()
