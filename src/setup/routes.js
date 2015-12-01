/**
 * Attach routes to a Express router router
 * @param     {Object}    Options {
 *                                  routers: Object
 *                                  folder: String
 *                                }
 * @return    {Express.router}
 */
module.exports = function routes(ceres, prop) {
  var folder = ceres.config.folders[prop];
  var routers = ceres.config[prop];

  var router = require('express').Router();
  for (var name in routers) {
    if (!routers.hasOwnProperty(name)) {
      continue;
    }
    var controller = require(folder + '/' + name);
    var endpoint = routers[name];
    router.use(endpoint, controller.router(ceres.config));
    ceres.log._ceres.silly('Setup endpoint %s from %s', endpoint, name);
  }
  ceres.log._ceres.silly('Setup router for %s', prop);
  return router;
};
