/*******************************************************************************
 * Worker Instance
 ******************************************************************************/
var moment = require('moment');
var Application = require('./setup/express');
var Setup = require('./setup');

module.exports = function(ceres) {

  // The master doesn't do very much besides load the workers so we also use it
  // handle the queues. If a queue crashes then the master will crash as well...
  if (ceres.config.folders.queues) {
    // Load any files in this folder and apply this config
    Setup.directory(ceres.config.folders.queues, {
      config: ceres.config
    });

    ceres.log._ceres.silly('Queues ceres.configured');
  }

  // Setup Express
  var app = Application.call(ceres, ceres);
  ceres.log._ceres.silly('Express ceres.configured');

  // Setup DB
  var db = require('./db')(ceres.config);
  app.set('db', db);

  // Listen
  var server = app.listen(ceres.config.port, function() {

    var host = server.address().address === '::' ? 'localhost' : server.address().address;
    var port = server.address().port;

    // Calculate how long it took to load
    ceres.loadTime = process.hrtime(ceres.startTime);
    var loadTimeMs = Math.floor((ceres.loadTime[0] * 1e9 + ceres.loadTime[1])/ 1000000);
    var loadTimeS = moment.duration(loadTimeMs).asSeconds();

    ceres.log._ceres.silly('Instance took %ds to start', loadTimeS);

    ceres.log.info('Listening on http://%s:%s (%s)', host, port, ceres.config.env);
  });

  return server;
};
