importScripts("../lib/d3.v5.min.js");
importScripts("./messagehelper.js");

const DB_NAME = "QuakeReportData";
const DB_VERSION = 1;

onmessage = function(e) {
  if (e.data[0] == "init") {
    // Load file first to ensure that request.onsuccess runs after request.onupgradeneeded has finished.
    d3.csv("../data/mc1-reports-data.csv")
    .then(function(data) {
      postMessage(new StatusMessage(StatusMessage.LOADING));
      let request = indexedDB.open(DB_NAME, DB_VERSION);
      let needsUpdating = false;

      // Ran if indexedDB created or if the version requested is higher than the version found.
      request.onupgradeneeded = function(event) {
        needsUpdating = true;
        postMessage(new StatusMessage(StatusMessage.UPDATING));

        let db = event.target.result;
        let objectStore = createSchema(db);

        // Executed after the schema has been created.
        objectStore.transaction.oncomplete = function(ev) {
            // Convert values in dataset from strings to their proper types.
            data.forEach(function(report, index) {
              report.time = new Date(report.time);
              report.sewer_and_water = (report.sewer_and_water) ? +report.sewer_and_water : -1;
              report.power = (report.power) ? +report.power : -1;
              report.medical = (report.medical) ? +report.medical : -1;
              report.buildings = (report.buildings) ? +report.buildings : -1;
              report.shake_intensity = (report.shake_intensity) ? +report.shake_intensity : -1;
              report.location = +report.location;
              this[index] = report;
            }, data);

            // Sort the reports by date.
            data.sort(function(a,b) {
              return a.time - b.time;
            });

            postMessage(data);

            // Add the reports to the indexedDB.
            let reportObjectStore = db.transaction(["reports"], "readwrite").objectStore("reports");
            reportObjectStore.add(data[0]);
            let pending = true;
            data.forEach(function(report, index) {
              let request = reportObjectStore.add(report);
              if (index == data.length -1) {
                request.onsuccess = request.onerror = function(event) {
                  postMessage(new StatusMessage(StatusMessage.READY));
                };
              }
            });
        }
      }

      // Ran if an error occurs accessing the indexedDB
      request.onerror = function(event) {
        postMessage(new ErrorMessage(err));
      }

      // Ran if the database is opened successfully.
      request.onsuccess = function(event) {
        if (!needsUpdating)
          postMessage(new StatusMessage(StatusMessage.READY));
      }
    })
    .catch(function(error) {
      postMessage(error);
    })
  } else if (e.data[0] == "getavg") {
    let category = e.data[1];
    let location = (e.data[2]) ? e.data[2] : null;

    let request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = function(event) {
      let db = event.target.result;
      let reportObjectStore = db.transaction(["reports"], "readwrite").objectStore("reports");
      let cursorRequest;

      if (location) {
        let locationIndex = reportObjectStore.index("location");
        let keyRange = IDBKeyRange.only(location);
        cursorRequest = locationIndex.openCursor(keyRange);
      } else {
        cursorRequest = reportObjectStore.openCursor();
      }

      let data = [];
      cursorRequest.onsuccess = function(e) {
        let cursor = e.target.result;
        if (cursor) {
          let report = cursor.value;
          let rating = report[category]
          if (rating != -1)
            data.push(rating);
          cursor.continue();
        } else {
          postMessage(data);
        }
      }
    }
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

function getSum(total, n) {
  return total + n;
}
