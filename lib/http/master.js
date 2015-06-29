/*******************************************************************************
 * Cluster Master - AKA Life Giver
 ******************************************************************************/

var cluster = require('cluster');
var _ = require('lodash');

module.exports.start = function(config) {
  /**
   * Keep track the number of worker's we've started
   * @type    {Number}
   */
  var workers = 0;

  /*****************************************************************************
   * Cluster Events
   ****************************************************************************/

  cluster.on('exit', function(worker, code, signal) {
    console.warn('Worker %s exited with code: %s %s', worker.process.pid, code, signal || '');

    var newWorker = cluster.fork();
    console.info('Worker %s:%s forked', ++workers, newWorker.process.pid);
  });

  /*****************************************************************************
   * Fork 'em
   ****************************************************************************/

  // Create the workers
  console.info('Forking %s workers', config.instances);
  for (var i = 0; i < config.instances; i++) {
    var worker = cluster.fork(config);
  }

};
