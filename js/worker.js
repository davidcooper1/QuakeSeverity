importScripts("../lib/d3.v5.min.js");
importScripts("./messagehelper.js");

let reportData = [];

self.addEventListener("message", function(event) {
  let message = event.data;
  if (message[0] == "init") {
    postMessage(new WorkerMessage(WorkerMessage.TYPE_STATUS, WorkerMessage.STATUS_LOADING));
    d3.csv("../data/mc1-reports-data.csv").then(function(data) {
      postMessage("Converting values...");

      postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS, 0, "Converting values..."));
      let lastPercent = 0;
      for (let i = 0; i < data.length; i++) {
        let report = {};
        data[i].time = new Date(data[i].time);
        data[i].sewer_and_water = (data[i].sewer_and_water) ? +data[i].sewer_and_water : -1;
        data[i].power = (data[i].power) ? +data[i].power : -1;
        data[i].roads_and_bridges = (data[i].roads_and_bridges) ? +data[i].roads_and_bridges : -1;
        data[i].medical = (data[i].medical) ? +data[i].medical : -1;
        data[i].buildings = (data[i].buildings) ? +data[i].buildings : -1;
        data[i].shake_intensity = (data[i].shake_intensity) ? +data[i].shake_intensity : -1;
        data[i].location = +data[i].location;

        let percent = ((i + 1) / data.length * 100) >> 0;
        if (lastPercent != percent) {
          postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS, percent, "Converting values..."));
          lastPercent = percent;
        }
      }

      postMessage("Sorting by time...");
      data.sort(function(a, b) {
        return a.time - b.time;
      });

      postMessage("Sorting by location...");
      data.sort(function(a,b) {
        return a.location - b.location;
      });

      postMessage(new WorkerMessage(WorkerMessage.TYPE_PROGRESS_FIN));

      postMessage(data[0]);
      reportData = data;
      postMessage("Done");
      postMessage(new WorkerMessage(WorkerMessage.TYPE_STATUS, WorkerMessage.STATUS_READY));
    }).catch(function(data) {
      postMessage(new WorkerMessage(WorkerMessage.TYPE_ERROR, "Error loading csv."));
    });
  } else if (message[0] == "getavg") {
    let category = message[1];
    let sums = (new Array(20)).fill(0);
    let counts = (new Array(20)).fill(0);
    postMessage(reportData);
    for (let i = 0; i < reportData.length; i++) {
      let intensity = reportData[i][category];
      if (intensity != -1) {
        sums[reportData[i].location] += intensity;
        counts[reportData[i].location] += 1;
      }
    }

    for (let i = 1; i < 20; i++) {
      postMessage(new WorkerMessage(
        WorkerMessage.TYPE_DATA,
        "intensity",
        i,
        sums[i] / counts[i]
      ));
    }
  }

});
