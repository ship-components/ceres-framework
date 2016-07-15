var Server = require('./Server');
var moment = require('moment');
var sticky = require('sticky-session');

/**
 * Log the time it took to start
 * @param  {String} str
 * @param  {Ceres}  ceres
 */
function logStartTime(str, ceres) {
    // Calculate how long it took to load
    ceres.loadTime = process.hrtime(ceres.startTime);
    var loadTimeMs = Math.floor((ceres.loadTime[0] * 1e9 + ceres.loadTime[1]) / 1000000);
    var loadTimes = moment.duration(loadTimeMs).asSeconds();
    // Log it
    ceres.log._ceres.silly(str, loadTimes);
}

module.exports = function(ceres) {
  // Ensure secret is present
  if (!ceres.config.secret) {
    console.error('Unable to find secret.');
    process.exit(1);
  }

  // Setup express server
  var server = Server.call(ceres, ceres);

  if (!ceres.config.instances || ceres.config.instances === 1) {
    // Skip sticky session setup if we only have a single instance. Allows
    // for debugging
    server.listen(ceres.config.port, function(){
      logStartTime('Server took %ds to start listening', ceres);
      ceres.log._ceres.info('Listening on %d (%s)', ceres.config.port, ceres.config.env);
    });
    return;
  }

  // Start sticky session server which handles the cluster
  var isChild = sticky.listen(server, ceres.config.port, {
    workers: ceres.config.instances
  });

  if (!isChild) {
    server.once('listening', function(){
      logStartTime('Master took %ds to start listening', ceres);
      ceres.log._ceres.info('Listening on %d (%s)', ceres.config.port, ceres.config.env);
    });
  } else {
    logStartTime('Child took %ds to configure', ceres);
  }
};
