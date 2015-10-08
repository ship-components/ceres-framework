/*******************************************************************************
 * Worker Instance
 ******************************************************************************/
var moment = require('moment');
var Application = require('./app');
var Setup = require('../setup');

module.exports.fork = function(config) {

  // The master doesn't do very much besides load the workers so we also use it
  // handle the queues. If a queue crashes then the master will crash as well...
  if (config.folders.queues) {
    // Load any files in this folder and apply this config
    Setup.directory(config.folders.queues, {
      config: config
    });
  }

  // Setup Express
  var app = Application.call(this, config);

  // Setup DB
  var db = require('../db')(config);
  app.set('db', db);

  // Listen
  var server = app.listen(config.port, function() {

    var host = server.address().address === '::' ? 'localhost' : server.address().address;
    var port = server.address().port;

    // Calculate how long it took to load
    var diff = process.hrtime(global.startTime);
    global.startTime = void 0;
    var loadTime = Math.floor((diff[0] * 1e9 + diff[1])/ 1000000);
    loadTime = moment.duration(loadTime).asSeconds();

    if(config.verbose > 0) {
      console.info('Instance took %ds to start', loadTime);
    }

    console.info('Listening on http://%s:%s (%s)', host, port, config.env);
  });

  return server;
};
