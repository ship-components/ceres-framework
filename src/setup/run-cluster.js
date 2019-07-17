const cluster = require('cluster');
const Promise = require('bluebird');

const Server = require('./Server');
const logStartTime = require('../lib/logStartTime');

/**
 * Fork a new worker and listen for log any errors
 * @param    {Ceres}    ceres
 */
function forkWorker(ceres, env) {
  env = typeof env === 'object' ? env : {};
  const worker = cluster.fork(env);
  worker.on('error', err => {
    ceres.log.internal.error(err);
  });
}

/**
 * Make sure everything is setup the way we need to be before we start Listening
 * @param  {Ceres}    ceres
 * @return {Promise}
 */
module.exports = function runCluster(ceres) {
  // processManagement
  return this.connect.call(this, ceres).then(function listen() {
    return new Promise((resolve, reject) => {
      try {
        if (!ceres.config.instances || ceres.config.instances === 1) {
          ceres.log.internal.info('Starting server in single instance mode...');
          // If we only have a single instance no need to run the cluster
          Server.call(ceres, ceres).listen(ceres.config.port, () => {
            logStartTime('Server took %ds to start listening', ceres);
            ceres.log.internal.info('Listening on %d (%s)', ceres.config.port, ceres.config.env);
            resolve();
          });
          return;
        }

        if (cluster.isMaster) {
          // Fork children
          for (let i = 0; i < ceres.config.instances; i += 1) {
            forkWorker(ceres, { CERES_UNIQUE_ID: i });
          }

          // Attempt to restart children that crash
          cluster.on('exit', (worker, code, signal) => {
            if (signal) {
              ceres.log.internal.info('worker %s was killed by %s', worker.process.pid, signal);
            } else if (code !== 0) {
              ceres.log.internal.error(
                'worker %s exited with %s. Starting new worker...',
                worker.process.pid,
                code,
                {
                  exitCode: code,
                  argv: process.argv,
                }
              );
              try {
                forkWorker(ceres, { CERES_UNIQUE_ID: worker.process.env.CERES_UNIQUE_ID });
              } catch (err) {
                ceres.log.internal.error(err, e => {
                  if (e) {
                    ceres.log.internal.error(e);
                  }
                  // If we fail to fork, then just exit to prevent infinite loop
                  process.exit(1);
                });
              }
            }
          });

          ceres.log.internal.info('Master spawned %d children', ceres.config.instances);
        } else {
          // Setup the server
          Server.call(ceres, ceres).listen(ceres.config.port, () => {
            logStartTime('Child ready after %ds', ceres);
            ceres.log.internal.info('Listening on %d (%s)', ceres.config.port, ceres.config.env);
            resolve();
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  });
};
