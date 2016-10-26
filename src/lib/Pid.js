var fs = require('fs');
var path = require('path');
var cluster = require('cluster');

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
 * Create Pid
 * @param  {String} path Path to save
 * @param  {Object} options (optional) Settings
 * @example
 * 	var Pid = require('./Pid');
 * 	var pid = new Pid('/var/log/app.pid');
 */
function Pid(filename, options, logger) {
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

  if (!cluster.isMaster) {
    // Skip if this isn't the master
    return;
  }

  // Write pid file
  this.create(function(){
    if (this.options.removeOnExit) {
      process.on('exit', this.remove.bind(this));
    }
  }.bind(this));
}

/**
 * Sync rmeove pid
 * @return {Boolean}
 */
Pid.prototype.remove = function remove() {
  try {
    fs.unlinkSync(this.options.path);
    return true;
  } catch(err) {
    console.error(err);
    return false;
  }
};

/**
 * Create pid file
 */
Pid.prototype.create = function create(callback) {
  // Open up file descriptor. By default fail if it exists
  fs.open(this.options.path, this.options.overwrite ? 'w' : 'wx', function(err, fd){
     if (err) {
       throw err;
     }
     writePid(fd, callback);
   });
};

module.exports = Pid;
