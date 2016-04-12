/*******************************************************************************
 * Cluster Master - AKA Life Giver
 ******************************************************************************/

var cluster = require('cluster');
var _ = require('lodash');

module.exports = function(ceres) {

  /**
   * Keep track the number of worker's we've started
   * @type    {Number}
   */
  var workerCount = 0;

  /**
   * Track errors and exit if we have too many
   * @type {Number}
   */
  var errorCount = 0;

  var workers = {};

  /**
   * Fork a worker
   */
  var forkWorker = function() {
    workerCount += 1;
    var worker = cluster.fork(ceres.config);
    ceres.log._ceres.silly('Worker %s-%s forked', workerCount, worker.process.pid);

    workers[worker.process.pid] = worker;
  }

  /*****************************************************************************
   * Cluster Events
   ****************************************************************************/

  cluster.on('exit', function(worker, code, signal) {
    ceres.log._ceres.error('Worker %s exited with code: %s %s', worker.process.pid, code, signal || '');

    errorCount += 1;
    if (errorCount > 10) {
      console.error('Encountered too many errors. Exiting...');
      process.exit(127);
    }
    delete workers[worker.process.pid];
    forkWorker();
  });

  /*****************************************************************************
   * Fork 'em
   ****************************************************************************/

  // Create the workerCount
  ceres.log._ceres.info('Forking %s workers', ceres.config.instances);
  for (var i = 0; i < ceres.config.instances; i++) {
    forkWorker();
  }

  /*****************************************************************************
   * Cleanup
   ****************************************************************************/
  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(function(signal){
    process.on(signal, function() {
      ceres.log._ceres.info('Recieved ' + signal +'. Cleaning up any workers...');
      for (var pid in workers) {
        if (workers.hasOwnProperty(pid)) {
          ceres.log._ceres.debug('Killing ' + pid + '...');
          workers[pid].kill();
        }
      }
      ceres.log._ceres.debug('Exiting...');
      process.exit();
    });
  });
};
