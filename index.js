/*******************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Entry point for Express/React Framework
 ******************************************************************************/

global.startTime = process.hrtime();

var _ = require('lodash');

/**
 * Modules to apply config
 *
 * @type    {Object}
 */
var modules = {
  Model: './lib/rest/Model',
  Controller: './lib/rest/Controller',
  Pipeline: './lib/render/Pipeline'
};

/**
 * Application Model
 *
 * @type    {Object}
 */
var Ceres = {

  /**
   * App Config
   *
   * @type    {Object}
   */
  config: null,

  /**
   * Bootstrap the config
   *
   * @type    {[type]}
   */
  load: function(config) {
    this.config = require('./lib/config').extend(config);
    return this;
  },

  /**
   * Load the modules and run commands from the cli
   *
   * @param     {Function}    callback
   */
  start: function(callback) {

    // Setup Modules
    for(var key in modules) {
      if(modules.hasOwnProperty(key)) {
        // Pass config to each module
        this[key] = require(modules[key]).call(this, this.config);
      }
    }

    /**
     * Default Commands
     *
     * @type    {Object}
     */
    var commands = require('./lib/commands')(this.config);

    /**
     * Get user commands
     *
     * @type    {Object}
     */
    var userCommands = callback.call(this, this.config);

    /**
     * Merge them
     *
     * @type    {Object}
     */
    var routes = _.extend(commands, userCommands);

    if (_.isFunction(routes[this.config.command])) {
      routes[this.config.command].call(this, this.config);
    } else {
      console.log('Unknown Command: %s', this.config.command);
    }
  }
};

module.exports = _.bindAll(Ceres);
