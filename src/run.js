var master = require('./master');
var child = require('./child');
var cluster = require('cluster');

module.exports = function(ceres) {
  // Ensure secret is present
  if (!ceres.config.secret) {
    console.error('Unable to find secret.');
    process.exit();
  }

  if (ceres.config.instances && ceres.config.instances > 1) {
    ceres.log._ceres.silly('Starting cluster with %d workers', ceres.config.instances);

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
