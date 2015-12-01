/**
 * Run Command
 *
 * @return    {Function}
 */
module.exports = function run(config) {
  var master = require('../master');
  var child = require('../child');

  // Ensure secret is present
  if (!config.secret) {
    throw new Error('Unable to find secret.');
  }

  if(config.instances && config.instances > 1) {
    // Clustering
    var cluster = require('cluster');

    if (cluster.isMaster) {
      master.call(this, config);
    } else {
      child.call(this, config);
    }
  } else {
    // Single Instance
    child.call(this, config);
  }
};
