/*******************************************************************************
 * Worker Instance
 ******************************************************************************/

module.exports.fork = function(config) {
  // Setup Express
  var app = require('./app')(config);

  // Listen
  var server = app.listen(config.port, function() {

    var host = server.address().address === '::' ? 'localhost' : server.address().address;
    var port = server.address().port;

    // Calculate how long it took to load
    var diff = process.hrtime(global.startTime);
    global.startTime = void 0;
    var loadTime = Math.floor((diff[0] * 1e9 + diff[1])/ 1000000);

    console.info('Started listening on http://%s:%s after %dms (%s)', host, port, loadTime, config.env);
  });

  return server;
};
