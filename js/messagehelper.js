// Class made to wrap data sent back to webpage.
class WorkerMessage {

  constructor(type, ...args) {
    this.type = type;
    this.data = args;
  }

}

// Status IDs for messages of TYPE_STATUS.
WorkerMessage.STATUS_READY = 0;
WorkerMessage.STATUS_LOADING = 1;
WorkerMessage.STATUS_UPDATING = 2;

// Message headers to denote message types.
WorkerMessage.TYPE_STATUS         = "status";
WorkerMessage.TYPE_ERROR          = "error";
WorkerMessage.TYPE_PROGRESS_FIN   = "pfin";
WorkerMessage.TYPE_PROGRESS       = "progress";
WorkerMessage.TYPE_DATA           = "data";
