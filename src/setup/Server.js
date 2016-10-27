/*******************************************************************************
 * Worker Instance
 ******************************************************************************/
var http = require('http');

var Application = require('./express');
var directory = require('./directory');
var sockets = require('./sockets');

module.exports = function(ceres) {
  // Bind the correct context
  if (ceres.config.folders.middleware) {
    ceres.config.middleware = directory(ceres.config.folders.middleware, ceres);
    ceres.middleware = ceres.config.middleware;
    ceres.log._ceres.silly('Middleware configured');
  }

  // The master doesn't do very much besides load the workers so we also use it
  // handle the queues. If a queue crashes then the master will crash as well...
  if (ceres.config.folders.queues) {
    // Load any files in this folder and apply this config
    directory(ceres.config.folders.queues, {
      config: ceres.config
    });

    ceres.log._ceres.silly('Queues ceres.configured');
  }

  // Setup Express
  var app = Application.call(ceres, ceres);
  ceres.log._ceres.silly('Express ceres.configured');

  if (ceres.config.db.type !== 'none') {
    // Setup DB
    var db = require('../db')(ceres.config);
    app.set('db', db);
  }

  // Setup server
  var server = http.Server(app);

  // Should we load sockets
  if (ceres.config.sockets && ceres.config.folders.sockets) {
    // Setup any sockets
    sockets(ceres, app, server);
  }

  return server;
};
