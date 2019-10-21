const Promise = require('bluebird');
const { fork } = require('child_process');

const Server = require('./Server');
const logStartTime = require('../lib/logStartTime');

/**
 * Unique id of each child process
 * @type    {Number}
 */
let uniqueIds = 0;

/**
 * Active child processes
 * @type    {Array}
 */
const workers = [];

/**
 * Settings to control worker
 * @type    {Object}
 */
const childSettings = {
  restart: true,
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
  const id = uniqueIds;
  uniqueIds += 1;

  // Rerun with the same arguments
  const worker = fork(process.argv[1], process.argv, {
    env: {
      // Each process gets a unique port
      PORT: port,

      // And a unique ID. Only children get this
      CERES_UNIQUE_ID: id,

      // Let the children know their index
      WORKER_INDEX: workerIndex,
    },
  });

  // Loggin
  ceres.log.internal.debug('Spawned child #%s - %s', id, worker.pid);

  // Keep track of the active workers
  workers.push(worker);

  // Log any errors
  worker.on('error', err => {
    ceres.log.internal.error(err);
  });

  // Listen to messages from the parent
  worker.on('message', obj => {
    ceres.log.internal.error('%s recieved %s', worker.pid, obj);
    if (typeof obj === 'object') {
      Object.assign(childSettings, obj);
    }
  });

  // Attempt to respawn unexcepted crashes
  worker.on('exit', (code, signal) => {
    if (code && code > 0) {
      ceres.log.internal.error('%s exited with %s', worker.pid, code);
    } else if (signal) {
      ceres.log.internal.debug('%s received %s', worker.pid, signal);
    }

    const index = workers.indexOf(worker);
    if (index !== -1) {
      workers.splice(index, 1);
    }

    // Respawn the child if we get an error code. Do not respawn if we received
    // a signal. Respawning on signals leads to endless recurision. It hurts.
    if (code && code > 0 && childSettings.restart === true) {
      ceres.log.internal.info('Repawning new process...', worker.pid);
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
  return new Promise((resolve, reject) => {
    try {
      Server.call(ceres, ceres).listen(ceres.config.port, () => {
        logStartTime('Child took %ds to start listening', ceres);
        ceres.log.internal.info(
          'Child #%s listening on %d (%s)',
          process.env.CERES_UNIQUE_ID,
          ceres.config.port,
          ceres.config.env
        );
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Make sure everything is setup the way we need to be before we start Listening
 * @param  {Ceres}    ceres
 * @return {Promise}
 */
module.exports = ceres => {
  return new Promise((resolve, reject) => {
    // CERES_UNIQUE_ID gets automatically assigned to children
    const isMaster = typeof process.env.CERES_UNIQUE_ID !== 'string';

    if (isMaster) {
      // Master

      // Ensure we always have an array
      const ports = ceres.config.port instanceof Array ? ceres.config.port : [ceres.config.port];

      ceres.log.internal.debug('Master forking %d instances - %s', ports.length, ports.join(', '));
      for (let i = 0; i < ports.length; i += 1) {
        spawn(ceres, ports[i], i);
      }

      // Clean up any workers
      ['SIGTERM', 'SIGINT'].forEach(signal => {
        process.on(signal, () => {
          ceres.log.internal.debug(
            'Master %s received %s. Attempting to clean up workers...',
            process.pid,
            signal,
            {
              pid: process.pid,
            }
          );
          workers.forEach(worker => {
            worker.send({
              restart: false,
            });
            worker.kill('SIGKILL');
          });
          process.exit(signal);
        });
      });

      resolve();
    } else {
      // Child
      ceres.connect
        .call(ceres, ceres)
        .then(listen.bind(ceres, ceres))
        .then(resolve)
        .catch(reject);
    }
  });
};
