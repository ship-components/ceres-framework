var express = require('express');
var path = require('path');

/**
 * Attach routes to a Express router router
 * @param     {Object}    Options {
 *                                  routers: Object
 *                                  folder: String
 *                                }
 * @return    {Express.router}
 */
var Benchmark = require('../lib/Benchmark');

module.exports = function routes(ceres, prop) {
  var folder = ceres.config.folders[prop];
  var routers = ceres.config[prop];

  var router = new express.Router();
  for (var name in routers) {
    if (!routers.hasOwnProperty(name)) {
      continue;
    }

    try {
      var benchmark = new Benchmark();
      var controller = require(path.resolve(folder + '/' + name));
      var endpoint = routers[name];
      controller.name = name;
      controller.endpoint = endpoint;
      router.use(endpoint, controller.router(ceres));
      benchmark.stop();
      const SLOW_SETUP_CUTOFF_MS = 200;
      if (benchmark.val() > SLOW_SETUP_CUTOFF_MS) {
        ceres.log._ceres.debug('[%s] %s -> %s took longer than %dms to initialize - %ss', prop, endpoint, name, SLOW_SETUP_CUTOFF_MS, (benchmark.val() / 1000).toLocaleString(), { name, duration: benchmark.val() });
      } else {
        ceres.log._ceres.silly('[%s] %s -> %s initialized - %ss', prop, endpoint, name, (benchmark.val() / 1000).toLocaleString(), { name, duration: benchmark.val() });
      }
    } catch(err) {
      ceres.log._ceres.error('Unable to setup', name);
      throw err;
    }
  }
  ceres.log._ceres.silly('Setup router for %s', prop);
  return router;
};
