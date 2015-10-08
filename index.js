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
   * Base Rest Controller API
   *
   * @type {Object}
   */
  Rest: {

    /**
     * Base Controller
     *
     * @type {Object}
     */
    Controller: require(path.resolve(__dirname + '/lib/rest/Controller')),

    /**
     * Base Model
     *
     * @type {Object}
     */
    Model: require(path.resolve(__dirname + '/lib/rest/Model')),

  },

  /**
   * Render Pipline
   *
   * @type {Object}
   */
  Pipeline: require(path.resolve(__dirname + '/lib/render/Pipeline')),

  /**
   * Load the modules and run commands from the cli
   *
   * @param     {Function}    callback
   */
  start: function(callback) {
    // Bootstrap config
    this.config = Setup.config();

    if (this.config.verbose > 0) {
      console.info('Config: ', this.config);
    }

    if (this.config.folders.middleware) {
      this.config.middleware = Setup.directory(this.config.folders.middleware, {
        config: this.config
      });
    }

    this.Database = require(__dirname + '/lib/db')(this.config);

    // Bind the correct context
    this.Pipeline.create = this.Pipeline.create.bind(this);

    this.Rest.Controller.extend = this.Rest.Controller.extend.bind(this);
    this.Rest.Model.extend = this.Rest.Model.extend.bind(this);

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
