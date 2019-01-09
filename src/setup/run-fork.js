var Promise = require('bluebird');
var fork = require('child_process').fork;

var Server = require('./Server');
var logStartTime = require('../lib/logStartTime');

/**
 * Unique id of each child process
 * @type    {Number}
 */
var uniqueIds = 0;

/**
 * Active child processes
 * @type    {Array}
 */
var workers = [];

/**
 * Settings to control worker
 * @type    {Object}
 */
var childSettings = {
  restart: true
};

/**
 * Fork the application and run it on a specific port. Recursively spawn a new
 * intsance if it crashes
 * @param    {Object}    ceres    [description]
 * @param    {Number}    port     [description]
 * @return   {Undefined}
 */
function spawn(ceres, port, workerIndex) {
  /**
	 * Give each child a uniqueId
	 * @type    {Number}
	 */
  var id = ++uniqueIds;

  // Rerun with the same arguments
  var worker = fork(process.argv[1], process.argv, {
    env: {

      // Each process gets a unique port
      PORT: port,

      // And a unique ID. Only children get this
      CERES_UNIQUE_ID: id,

      // Let the children know their index
      WORKER_INDEX: workerIndex
    }
  });

  // Loggin
  ceres.log._ceres.debug('Spawned child #%s - %s', id, worker.pid);

  // Keep track of the active workers
  workers.push(worker);

  // Log any errors
  worker.on('error', function(err){
    ceres.log._ceres.error(err);
  });

  // Listen to messages from the parent
  worker.on('message', function(obj){
    ceres.log._ceres.error('%s recieved %s', worker.pid, obj);
    if (typeof obj === 'object') {
      Object.assign(childSettings, obj);
    }
  });

  // Attempt to respawn unexcepted crashes
  worker.on('exit', function(code, signal){
    if (code && code > 0) {
      ceres.log._ceres.error('%s exited with %s', worker.pid, code);
    } else if (signal) {
      ceres.log._ceres.debug('%s received %s', worker.pid, signal);
    }

    var index = workers.indexOf(worker);
    if (index !== -1) {
      workers.splice(index, 1);
    }

    // Respawn the child if we get an error code. Do not respawn if we received
    // a signal. Respawning on signals leads to endless recurision. It hurts.
    if (code && code > 0 && childSettings.restart === true) {
      ceres.log._ceres.info('Repawning new process...', worker.pid);
      spawn(ceres, port, workerIndex);
    }
  });
}

/**
 * Setup and start listening
 * @param  {Ceres} ceres
 * @return {Promise}
 */
function listen(ceres) {
  return new Promise(function(resolve, reject){
    try {
      Server.call(ceres, ceres).listen(ceres.config.port, function(){
        logStartTime('Child took %ds to start listening', ceres);
        ceres.log._ceres.info('Child #%s listening on %d (%s)', process.env.CERES_UNIQUE_ID, ceres.config.port, ceres.config.env);
        resolve();
      });
    } catch(err) {
      reject(err);
    }
  });
}

/**
 * Make sure everything is setup the way we need to be before we start Listening
 * @param  {Ceres}    ceres
 * @return {Promise}
 */
module.exports = function(ceres) {
  return new Promise(function(resolve, reject){
    // CERES_UNIQUE_ID gets automatically assigned to children
    var isMaster = !process.env.CERES_UNIQUE_ID;

    if (isMaster) {
      // Master

      // Ensure we always have an array
      var ports = ceres.config.port instanceof Array ? ceres.config.port : [ceres.config.port];

      ceres.log._ceres.debug('Master forking %d instances - %s', ports.length, ports.join(', '));
      for (var i = 0; i < ports.length; i++) {
        spawn(ceres, ports[i], i);
      }

      // Clean up any workers
      ['SIGTERM', 'SIGINT'].forEach(function(signal){
        process.on(signal, function(){
          ceres.log._ceres.debug('Master received ' + signal + '. Cleaning up workers...');
          workers.forEach(function(worker){
            worker.send({
              restart: false
            });
            worker.kill('SIGKILL');
          });
        });
      });

      resolve();
    } else {
      // Child
      ceres.connect.call(ceres, ceres)
        .then(listen.bind(ceres, ceres))
        .then(resolve)
        .catch(reject);
    }
  });
};
