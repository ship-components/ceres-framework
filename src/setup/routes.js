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

  var router = require('express').Router();
  for (var name in routers) {
    if (!routers.hasOwnProperty(name)) {
      continue;
    }

    var benchmark = new Benchmark();
    var controller = require(folder + '/' + name);
    var endpoint = routers[name];
    controller.name = name;
    controller.endpoint = endpoint;
    router.use(endpoint, controller.router(ceres, ceres.config, name));
    ceres.log._ceres.silly('Setup endpoint %s from %s in %dms', endpoint, name, benchmark.stop());
  }
  ceres.log._ceres.silly('Setup router for %s', prop);
  return router;
};
