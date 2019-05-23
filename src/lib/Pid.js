var fs = require('fs');
var path = require('path');
var EventEmitter = require('events');

/**
 * Write pid to file description
 * @param  {FileDescriptor} fd
 */
function writePid(fd, callback) {
  var buf = new Buffer(process.pid + '\n');
  fs.write(fd, buf, 0, buf.length, null, function(err){
    if (err) {
      throw err;
    }
    fs.close(fd, callback);
  });
}

/**
 * Check to see if a specific process id is actually running
 * @param    {Number}    pid
 * @return   {Boolean}
 */
function processExists(pid) {
  try {
    return process.kill(pid, 0);
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/**
 * Create Pid
 * @param  {String} path Path to save
 * @param  {Object} options (optional) Settings
 * @example
 * 	var Pid = require('./Pid');
 * 	var pid = new Pid('/var/log/app.pid');
 */
function Pid(filename, options) {
  /**
   * Default options
   * @type {Object}
   */
  this.options = {
    /**
     * File path to pid
     */
    path: path.resolve(filename),
    /**
     * Automatically remove it when the process exists
     * @type {Boolean}
     */
    removeOnExit: true,
    /**
     * Overwrite an existing pid?
     * @type {Boolean}
     */
    overwrite: true
  };
  Object.assign(this.options, options);

  this.id = process.pid;

  // Emitter
  this._events = new EventEmitter();
  this.on = this._events.on.bind(this._events);
  this.once = this._events.once.bind(this._events);
  this.off = this._events.removeListener.bind(this._events);
  this.emit = this._events.emit.bind(this._events);

  // Bindings
  this.create = this.create.bind(this);
  this.remote = this.remove.bind(this);

  // Write pid file
  this.create(function(err){
    if (err) {
      this.emit('error', err);
    } else if (this.options.removeOnExit) {
      process.on('exit', this.remove.bind(this));
    }
    this.emit('created', this);
  }.bind(this));
}

/**
 * Sync remove pid
 * @return {Boolean}
 */
Pid.prototype.remove = function remove() {
  try {
    fs.unlinkSync(this.options.path);
    this.emit('removed', this);
    return true;
  } catch(err) {
    if (err.code === 'ENOENT') {
      // Ignore any errors for missing files
      return true;
    }
    console.error(err);
    return false;
  }
};

/**
 * Create pid file
 */
Pid.prototype.create = function create(callback) {
  let pid = NaN;
  try {
    // Attempt to read the pid. Must be sync otherwise the rest of the app starts too quick
    pid = parseInt(fs.readFileSync(this.options.path, 'utf8'), 10);
  } catch(e) {
    // If it doesn't exist that's cool. We'll make it later.
    if (e.code !== 'ENOENT') {
      callback(e);
      return;
    }
  }

  if (pid === process.pid) {
    // The pid file already exists and matches the current pid
    callback();
    return;
  }

  // Check to see if we can see the process running
  const existingProcessRunning = !isNaN(pid) && processExists(pid);

  if (this.options.overwrite && existingProcessRunning) {
    this.emit('existing', pid, this.id);
    // If we do find a pid and we see a process is running, try to close it
    process.kill(pid, 'SIGTERM');
  } else if (!this.options.overwrite && existingProcessRunning) {
    // If we're not in overwrite mode and we see an existing PID throw
    callback(new Error('application already running - ' + pid.toString()));
    return;
  }

  // Open up file descriptor. By default fail if it exists
  fs.open(this.options.path, this.options.overwrite ? 'w' : 'wx', function(err, fd) {
    if (err) {
      callback(err);
    } else {
      writePid(fd, callback);
    }
  });
};

module.exports = Pid;
