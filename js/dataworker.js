importScripts("../lib/sql-wasm.js");
importScripts("./messagehelper.js");

let db;

// Handle messages coming from webpage.
self.addEventListener("message", function(event) {
  let message = event.data;
  if (message[0] === "init") {
    loadDBObject();
  } else if (message[0] == "getdaterange") {
    // Get the range of times for all the reports.
    let result = db.exec("SELECT MIN(time_of_report) AS earliest, MAX(time_of_report) AS latest FROM grouped_reports");

    // Return the range to the webpage.
    postMessage(new WorkerMessage(
      WorkerMessage.TYPE_DATA,
      "range",
      result[0].values[0][0],
      result[0].values[0][1]
    ));
  } else if (message[0] == "getavg") {
    let category = message[1];
    let start = message[2];
    let end = message[3];

    // Get average intensity of reports in the specified time frame for the
    // specified neighborhood and category.
    let result = db.exec(`
      SELECT id, COALESCE(category, 0) FROM neighborhoods
        LEFT JOIN (SELECT neighborhood_id, AVG(${category}) AS category FROM grouped_reports
          WHERE time_of_report >= ${start} AND time_of_report <= ${end}
          GROUP BY neighborhood_id
        ) ON id = neighborhood_id;`);

    let values = result[0].values;

    // Return the average intensities of each neighborhood to the webpage.
    for (let i = 0; i < values.length; i++) {
      // Message data: intensity header, category, neighborhood id, intensity
      postMessage(new WorkerMessage(
        WorkerMessage.TYPE_DATA,
        "intensity",
        category,
        values[i][0],
        values[i][1]
      ));
    }
  } else if (message[0] == "getpath") {
    let category = message[1];
    let neighborhood_id = message[2];

    // Get the set of intensities from avg_reports table for a neighborhood and category.

    // avg_reports intensities are averaged with all reports within 30 minutes before or after
    // the current report.
    let result = db.exec(`
      SELECT time_of_report, ${category} FROM avg_reports
        WHERE neighborhood_id = ${neighborhood_id}
        ORDER BY time_of_report;
    `);

    let values = result[0].values;

    // Return the set of intensities to the webpage.
    postMessage(new WorkerMessage(
      WorkerMessage.TYPE_DATA,
      "time_data",
      category,
      neighborhood_id,
      values
    ));
  }
});

function loadDBObject() {
  // Load the sql-wasm module.
  initSqlJs({locateFile: fileName => `../bin/${fileName}`}).then(function(SQL) {
    // Load the sqlite database file.
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "../data/report-data.sqlite", true);
    xhr.responseType = "arraybuffer";
    xhr.onload = e => {
      // Store database in the global scope.
      db = new SQL.Database(new Uint8Array(e.target.response));
      postMessage(new WorkerMessage(WorkerMessage.TYPE_STATUS, WorkerMessage.STATUS_READY));
    }
    xhr.onerror = e => {
      postMessage(new WorkerMessage(WorkerMessage.TYPE_ERROR, "Could not load database file."));
    }
    xhr.send();
  });
}
