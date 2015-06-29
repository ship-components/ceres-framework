var path = require('path');
var fs = require('fs');
var _ = require('lodash');

/**
 * Require all JS files in a folder
 *
 * @param     {String}    dir
 * @return    {Object<mixed>}
 */
function loadModulesFromPath(dir) {
  /**
   * Resolve any relative paths
   *
   * @type    {String}
   */
  dir = path.resolve(dir);

  /**
   * Interal collection of modules loaded
   *
   * @type    {Object}
   */
  var modules = {};

  /**
   * Get a list of items in a directory. This is synchronous since we're
   * only doing this once on application load
   *
   * @type    {Array}
   */
  var list = require('fs').readdirSync(dir);

  /**
   * Setup the Regex to filter out *.js files
   *
   * @type    {RegExp}
   */
  var jsFile = /.*\.js?$/;

  // Cycle through each item in the directory
  list.forEach(function(module) {
    //Check to see if with have a match and if we split it apartment
    module = module.match(jsFile);
    if (module) {
      // If we find a match try to load and save it. Otherwise log an error
      try {
        modules[module[0].replace('.js', '')] = require(dir + '/' + module[0]);
      } catch (err) {
        throw new Error('Unable to load ' + dir + '/' + module[0], err);
      }
    }
  });

  return modules;
}

/**
 * Load all js files in a folder and then call any modules that are functions
 * with the the application config. Returns a object of modules
 *
 * @param     {String}    dir
 * @param     {Object}    config
 * @return    {Object}
 */
module.exports = function directory(dir, options) {
  options = options || {};

  var modules = loadModulesFromPath(dir);

  if(!_.isObject(options.config)) {
    return modules;
  }

  var initialized = {};

  for(var name in modules) {
    if(!modules.hasOwnProperty(name)) {
      continue;
    }
    if(_.isFunction(modules[name])) {
      initialized[name] = modules[name].call(this, options.config);
    } else {
      initialized[name] = modules[name];
    }
  }

  return initialized;
};
