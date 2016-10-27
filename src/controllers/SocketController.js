/**
 * Creates a controller that listens and responds to socket events
 */
function SocketController(options) {
  options = options || {};
  if (!options.db) {
    throw new Error('options.db is not defined');
  }
  this.db = options.db;

  if (!options.socket) {
    throw new Error('options.socket is not defined');
  }
  this.socket = options.socket;

  // Provide some shortcuts
  this.emit = this.socket.emit.bind(this.socket);
  this.on = this.socket.on.bind(this.socket);

  this.actions = options.actions || {};

  // Ensure actions have the right context
  this.bindActions();
}

/**
 * Find all of the actions we can run and bind the right context
 */
SocketController.prototype.bindActions = function() {
  for (var key in this.actions) {
    if (!this.actions.hasOwnProperty(key)) {
      continue;
    }
    this.actions[key] = this.actions[key].bind(this);
  }
};

/**
 * Start listening to each of the available actions.
 */
SocketController.prototype.listen = function() {
  for (var key in this.actions) {
    if (!this.actions.hasOwnProperty(key)) {
      continue;
    }
    this.on(key, this.actions[key]);
  }
};

module.exports = SocketController;
