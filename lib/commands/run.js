/**
 * Run Command
 *
 * @return    {Function}
 */
module.exports = function run(config) {
  var master = require('../http/master');
  var child = require('../http/child');

  if(config.instances && config.instances > 1) {
    // Clustering
    var cluster = require('cluster');

    if (cluster.isMaster) {
      master.start.call(this, config);
    } else {
      child.fork.call(this, config);
    }
  } else {
    // Single Instance
    child.fork.call(this, config);
  }
};
