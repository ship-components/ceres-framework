var winston = require('winston');

module.exports = function(ceres) {
  var master = require('./master');
  var child = require('./child');

  // Ensure secret is present
  if (!ceres.config.secret) {
    console.error('Unable to find secret.');
    process.exit();
  }

  if (ceres.config.env === 'production') {
    // Save uncaught exceptions to their own file in production
    winston.handleExceptions(new winston.transports.DailyRotateFile({
      filename: ceres.config.folders.logs + '/exceptions.log',
      tailable: true
    }));
  }

  // Setup logging app
  ceres.log = require('./setup/logs')(ceres.config);
  // Setup internal framework logger so we can tell if its an app or framework erro
  ceres.log._ceres = require('./setup/logs')(ceres.config, 'ceres');

  if (ceres.config.instances && ceres.config.instances > 1) {
    ceres.log._ceres.silly('Starting cluster with %d workers', ceres.config.instances);
    // Clustering
    var cluster = require('cluster');

    if (cluster.isMaster) {
      master.call(ceres, ceres);
    } else {
      child.call(ceres, ceres);
    }
  } else {
    ceres.log._ceres.silly('Starting a single instance');

    // Single Instance
    child.call(ceres, ceres);
  }
};
