importScripts("../lib/sql-wasm.js");
importScripts("./messagehelper.js");

let db;

self.addEventListener("message", function(event) {
  let message = event.data;
  if (message[0] === "init") {
    loadDBObject();
  } else if (message[0] == "getdaterange") {
    let result = db.exec("SELECT MIN(time_of_report) AS earliest, MAX(time_of_report) AS latest FROM reports");
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
    postMessage(start);
    postMessage(end);
    let result = db.exec(`SELECT neighborhood_id, AVG(${category}) FROM reports WHERE time_of_report BETWEEN '${start}' AND '${end}' GROUP BY neighborhood_id`);

    let values = result[0].values;

    for (let i = 0; i < values.length; i++) {
      postMessage(new WorkerMessage(
        WorkerMessage.TYPE_DATA,
        "intensity",
        values[i][0],
        values[i][1]
      ));
    }
  }
});

function loadDBObject() {
  initSqlJs({locateFile: fileName => `../bin/${fileName}`}).then(function(SQL) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "../data/report-data.sqlite", true);
    xhr.responseType = "arraybuffer";
    xhr.onload = e => {
      db = new SQL.Database(new Uint8Array(e.target.response));
      postMessage(new WorkerMessage(WorkerMessage.TYPE_STATUS, WorkerMessage.STATUS_READY));
    }
    xhr.onerror = e => {
      postMessage(new WorkerMessage(WorkerMessage.TYPE_ERROR, "Could not load database file."));
    }
    xhr.send();
  });
}
