/** *****************************************************************************
 * Worker Instance
 ***************************************************************************** */
const http = require('http');

const Application = require('./express');
const directory = require('./directory');
const sockets = require('./sockets');

const Benchmark = require('../lib/Benchmark');

module.exports = function Server(ceres) {
  const benchmarks = {};
  benchmarks.express = Benchmark();

  ceres.log.internal.silly('Starting express configuration...');

  // Bind the correct context
  if (ceres.config.folders.middleware) {
    benchmarks.middleware = Benchmark();
    ceres.config.middleware = directory(ceres.config.folders.middleware, ceres);
    ceres.middleware = ceres.config.middleware;
    benchmarks.middleware.stop();
    ceres.log.internal.info(
      'Middleware setup complete - %ss',
      (benchmarks.middleware.val() / 1000).toLocaleString(),
      { duration: benchmarks.middleware.val() }
    );
  }

  // The master doesn't do very much besides load the workers so we also use it
  // handle the queues. If a queue crashes then the master will crash as well...
  if (ceres.config.folders.queues) {
    benchmarks.queues = Benchmark();
    // Load any files in this folder and apply this config
    directory(ceres.config.folders.queues, {
      config: ceres.config,
    });

    benchmarks.queues.stop();
    ceres.log.internal.info(
      'Queue setup complete - %ss',
      (benchmarks.queues.val() / 1000).toLocaleString(),
      { duration: benchmarks.queues.val() }
    );
  }

  // Setup Express
  const app = Application.call(ceres, ceres);

  if (ceres.config.db.type !== 'none') {
    // Setup DB
    const db = require('../db/index')(ceres);
    app.set('db', db);
  }

  // Setup server
  const server = new http.Server(app); // eslint-disable-line new-cap

  // Should we load sockets
  if (ceres.config.sockets && ceres.config.folders.sockets) {
    benchmarks.sockets = Benchmark();
    // Setup any sockets
    sockets(ceres, app, server);
    benchmarks.sockets.stop();
    ceres.log.internal.info(
      'Socket setup complete - %ss',
      (benchmarks.sockets.val() / 1000).toLocaleString(),
      { duration: benchmarks.sockets.val() }
    );
  }

  benchmarks.express.stop();
  ceres.log.internal.info(
    'Express setup complete - %ss',
    (benchmarks.express.val() / 1000).toLocaleString(),
    { duration: benchmarks.express.val() }
  );

  return server;
};
