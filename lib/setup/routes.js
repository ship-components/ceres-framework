/**
 * Attach routes to a Express router router
 * @param     {Object}    Options {
 *                                  routers: Object
 *                                  folder: String
 *                                }
 * @return    {Express.router}
 */
module.exports = function routes(options) {
  var router = require('express').Router();
  for (var name in options.routers) {
    if (!options.routers.hasOwnProperty(name)) {
      continue;
    }
    var controller = require(options.folder + '/' + name);
    var endpoint = options.routers[name];
    router.use(endpoint, controller.router());
  }
  return router;
};
