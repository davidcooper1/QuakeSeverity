class StatusMessage {

  constructor(status) {
    this.type = "status";
    this.status = status;
  }

}

StatusMessage.READY = 0;
StatusMessage.LOADING = 1;
StatusMessage.UPDATING = 2;

class ProgressMessage {

  constructor(i, n, msg) {
    this.type = "progress";
    this.percent = (i / n) * 100;
    this.msg = msg;
  }

}

class ErrorMessage {

  constructor(err) {
    this.type = "error"
    this.err = err;
  }

}
