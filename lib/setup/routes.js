/**
 * Attach routes to a Express router router
 * @param     {Object}    Options {
 *                                  routers: Object
 *                                  folder: String
 *                                }
 * @return    {Express.router}
 */
module.exports = function routes(config) {
  var router = require('express').Router();
  for (var name in config.routers) {
    if (!config.routers.hasOwnProperty(name)) {
      continue;
    }
    var controller = require(config.folder + '/' + name);
    var endpoint = config.routers[name];
    router.use(endpoint, controller.router(config));
  }
  return router;
};
