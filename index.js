/*******************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Entry point for Express/React Framework
 ******************************************************************************/

global.startTime = process.hrtime();

var _ = require('lodash');
var path = require('path');

var Setup = require('./lib/setup');

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
    if (_.isString(config)) {
      config = require(config);
    }

    this.config = require('./lib/config').extend(config);
    return this;
  },

  /**
   * Load the modules and run commands from the cli
   *
   * @param     {Function}    callback
   */
  start: function(callback) {

    if (this.config.verbose > 0) {
      console.info('Config: ', this.config);
    }

    if (this.config.folders.middleware) {
      this.middleware = Setup.directory(this.config.folders.middleware, {
        config: this.config
      });
    }

    // Setup Modules
    for (var key in modules) {
      if (modules.hasOwnProperty(key)) {
        // Pass config to each module
        this[key] = require(modules[key]).call(this, this.config);
      }
    }

    /**
     * Default Commands
     *
     * @type    {Object}
     */
    var commands = Setup.directory(path.resolve(__dirname + '/lib/commands'));

    /**
     * Get user commands
     *
     * @type    {Object}
     */
    if (_.isFunction(callback)) {
      var userCommands = callback.call(this, this.config);
      commands = _.extend(commands, userCommands || {});
    }

    /**
     * Command to run
     *
     * @type    {String}
     */
    var command = this.config.command;

    // Did we find it? If not, is there a help command available?
    if (!_.isFunction(commands[command]) && _.isFunction(commands.help)) {
      command = 'help';
    } else if (!_.isFunction(commands[command])) {
      // Can't find anything
      console.error('Unknown Command. Help Unavailable');
      process.exit();
    }

    // Run the command, and if we have a result, output it
    commands[command].call(this, this.config, function(err, result) {
      if (err) {
        throw err;
      } else {
        console.log(result);
        process.exit();
      }
    });
  }
};

module.exports = _.bindAll(Ceres);
