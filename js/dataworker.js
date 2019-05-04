importScripts("../lib/d3.v5.min.js");
importScripts("./messagehelper.js");

const DB_NAME = "QuakeReportData";
const DB_VERSION = 1;

onmessage = function(e) {
  if (e.data[0] == "init") {
    postMessage(new WorkerMessage(WorkerMessage.TYPE_STATUS, WorkerMessage.STATUS_LOADING));
    let request = indexedDB.open(DB_NAME, DB_VERSION);
    let needsUpdating = false;

    // Ran if indexedDB created or if the version requested is higher than the version found.
    request.onupgradeneeded = function(event) {
      needsUpdating = true;
      postMessage(new WorkerMessage(WorkerMessage.TYPE_STATUS, WorkerMessage.STATUS_UPDATING));

      let db = event.target.result;
      let objectStore = createSchema(db);

      // Executed after the schema has been created.
      objectStore.transaction.oncomplete = function(ev) {
          d3.csv("../data/mc1-reports-data.csv").then(function(data) {
            // Convert values in dataset from strings to their proper types.

            postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS, 0, "Converting Values..."));
            let lastPercent = 0;

            data.forEach(function(report, index) {
              report.time = new Date(report.time);
              report.sewer_and_water = (report.sewer_and_water) ? +report.sewer_and_water : -1;
              report.power = (report.power) ? +report.power : -1;
              report.medical = (report.medical) ? +report.medical : -1;
              report.buildings = (report.buildings) ? +report.buildings : -1;
              report.shake_intensity = (report.shake_intensity) ? +report.shake_intensity : -1;
              report.location = +report.location;
              this[index] = report;

              let percent = ((index + 1) / this.length * 100) >> 0;
              if (lastPercent != percent) {
                postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS, percent, "Converting Values..."));
                lastPercent = percent;
              }
            }, data);

            // Sort the reports by date.
            data.sort(function(a,b) {
              return a.time - b.time;
            });

            // Sort the reports by location.
            data.sort(function(a,b) {
              return a.location - b.location;
            });

            postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS, 0, "Adding values to database..."));
            lastPercent = 0;

            // Add the reports to the indexedDB.
            let reportObjectStore = db.transaction(["reports"], "readwrite").objectStore("reports");
            reportObjectStore.add(data[0]);
            let pending = true;
            data.forEach(function(report, index) {
              let addRequest = reportObjectStore.add(report);
              if (index == this.length -1) {
                addRequest.onsuccess = addRequest.onerror = function(event) {
                  postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS_FIN));
                  postMessage(new WorkerMessage(WorkerMessage.TYPE_STATUS, WorkerMessage.STATUS_READY));
                };
              }

              let percent = ((index + 1) / this.length * 100) >> 0;
              if (lastPercent != percent) {
                postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS, percent, "Adding values to database..."));
                lastPercent = percent;
              }
            }, data);

            postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS, 0, "Finalizing database..."));

          }).catch(function(err) {
            postMessage(new WorkerMessage(WorkerMessage.TYPE_ERROR, err));
          });
      }
    }

    // Ran if an error occurs accessing the indexedDB
    request.onerror = function(event) {
      postMessage(new WorkerMessage(WorkerMessage.TYPE_ERROR, err));
    }

    // Ran if the database is opened successfully.
    request.onsuccess = function(event) {
      if (!needsUpdating) {
        event.target.result.close();
        postMessage(new WorkerMessage(WorkerMessage.TYPE_STATUS, WorkerMessage.STATUS_READY));
      }
    }
  } else if (e.data[0] == "getavg") {
    let category = e.data[1];

    let request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = function(event) {
      let db = event.target.result;
      let reportObjectStore = db.transaction(["reports"], "readonly").objectStore("reports");
      let locationIndex = reportObjectStore.index("location");
      let locationCursorRequest = locationIndex.openKeyCursor(null, "nextunique");

      function processCategoryParallel(location, categoryBounds) {
        //let categoryCursorRequest = reportObjectStore.openCursor(categoryBounds);
        let sum = 0;
        let n = 0;
        let eCount = 200;
        //let cursorReqs = []
        let cursorDoneCount = 0;
        let count = Math.ceil((categoryBounds.upper - categoryBounds.lower) / eCount);


        for (let j = 0; j < count; j++) {
          let i = j;
          let upper = categoryBounds.lower + (i + 1) * eCount;
          upper = (upper < categoryBounds.upper) ? upper : categoryBounds.upper;
          let cursorReq = reportObjectStore.openCursor(IDBKeyRange.bound(categoryBounds.lower + i * eCount, upper));
          cursorReq.onsuccess = function(e) {
            if (cursorReq.result) {
              let report = cursorReq.result.value;
              let rating = report[category];
              if (rating != -1) {
                sum += rating;
                n++;
              }
              cursorReq.result.continue();
            } else {
              if (++cursorDoneCount >= count) {
                postMessage(new WorkerMessage(
                  WorkerMessage.TYPE_DATA,
                  "intensity",
                  location,
                  sum / n
                ));
              }
            }
          }
        }
      }

      function processCategorySequential(location, categoryBounds) {
        let categoryCursorRequest = reportObjectStore.openCursor(categoryBounds);
        let sum = 0;
        let n = 0;

        categoryCursorRequest.onsuccess = function(ce) {
          let categoryCursor = ce.target.result;
          if (categoryCursor) {
            let report = categoryCursor.value;
            let rating = report[category];
            if (rating != -1) {
              sum += rating;
              n++;
            }
            categoryCursor.continue();
          } else {
            postMessage(new WorkerMessage(
              WorkerMessage.TYPE_DATA,
              "intensity",
              location,
              sum / n
            ));
          }
        }
      }

      let lastPrimaryKeyLocation = 1;
      let lastLocation;
      locationCursorRequest.onsuccess = function(le) {
        let locationCursor = le.target.result;
        if (locationCursor) {
          let countReq = locationCursor.source.count(locationCursor.key);
          countReq.onsuccess = function(e) {
            let count = countReq.result;
            let categoryBounds = IDBKeyRange.bound(locationCursor.primaryKey, locationCursor.primaryKey + count);
            processCategoryParallel(locationCursor.key, categoryBounds);
          }
          locationCursor.continue();
        } else {
          db.close();
        }
      }

    }
  } else if (e.data[0] == "get") {

  }
}

function createSchema(db) {
  let objectStore = db.createObjectStore("reports", {
    autoIncrement : true
  });

  objectStore.createIndex("time", "time", {
    unique : false
  });
  objectStore.createIndex("sewer_and_water", "sewer_and_water", {
    unique : false
  });
  objectStore.createIndex("power", "power", {
    unique : false
  });
  objectStore.createIndex("medical", "medical", {
    unique : false
  });
  objectStore.createIndex("buildings", "buildings", {
    unique : false
  });
  objectStore.createIndex("shake_intensity", "shake_intensity", {
    unique : false
  });
  objectStore.createIndex("location", "location", {
    unique : false
  });

  return objectStore
}

function sendProgress(i, n, msg) {
  postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS, i / n * 100, msg))
}

function getSum(total, n) {
  return total + n;
}
