// eslint-disable-next-line import/no-extraneous-dependencies
const sticky = require('sticky-session');
const Promise = require('bluebird');

const Server = require('./Server');
const logStartTime = require('../lib/logStartTime');

/**
 * Make sure everything is setup the way we need to be before we start Listening
 * @param  {import('../Ceres')} ceres
 * @return {Promise}
 */
module.exports = function runStickyCluster(ceres) {
  // processManagement
  return ceres.connect().then(function listen() {
    return new Promise((resolve, reject) => {
      try {
        // Setup express server
        const server = Server.call(ceres, ceres);

        if (!ceres.config.instances || ceres.config.instances === 1) {
          ceres.log.internal.info('Starting server in single instance mode...');
          // Skip sticky session setup if we only have a single instance. Allows
          // for debugging
          server.listen(ceres.config.port, () => {
            logStartTime('Server took %ds to start listening', ceres);
            ceres.log.internal.info('Listening on %d (%s)', ceres.config.port, ceres.config.env);
            resolve();
          });
          return;
        }

        // Start sticky session server which handles the cluster
        const isChild = sticky.listen(server, ceres.config.port, {
          workers: ceres.config.instances,
        });

        if (!isChild) {
          server.once('listening', () => {
            logStartTime('Master took %ds to start listening', ceres);
            ceres.log.internal.info('Listening on %d (%s)', ceres.config.port, ceres.config.env);
            resolve();
          });
        } else {
          logStartTime('Child ready after %ds', ceres);
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  });
};
