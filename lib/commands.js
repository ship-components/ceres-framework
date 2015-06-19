module.exports = function(config) {
  return {
    run: function() {
      var master = require('./master');
      var child = require('./child');

      if(config.instances && config.instances > 1) {
        // Clustering
        var cluster = require('cluster');

        if (cluster.isMaster) {
          master.start(config);
        } else {
          child.fork(config);
        }
      } else {
        // Single Instance
        child.fork(config);
      }
    }
  };
};
