from os import getcwd
from os.path import join
import csv
import time

cwd = getcwd()

with open(join(cwd, "mc1-reports-data.csv"), "r") as inFile :
    with open(join(cwd, "report-data.csv"), "w") as outFile :
        inCsv = csv.reader(inFile)
        outCsv = csv.writer(outFile)

        for row in inCsv :
            date = time.strptime(row[0], "%Y-%m-%d %H:%M:%S")
            millis = int(time.mktime(date) * 1000)

            other = [row[i] if row[i] != "" else "NULL" for i in range(1, len(row))]
            outCsv.writerow([millis, *other])
            #outCsv.writerow([millis, *row[1:]]);
