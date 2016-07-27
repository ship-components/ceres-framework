/*******************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Framework constructor
 ******************************************************************************/

var path = require('path');
var winston = require('winston');
var Setup = require('./setup');
var DailyRotateFile = require('winston-daily-rotate-file');

function Ceres() {
  this.startTime = process.hrtime();

  this.config = {};
}

Ceres.prototype.load = function(options) {
  // Bootstrap config
  this.config = Setup.config(options);

  if (this.config.env === 'production') {
    // Save uncaught exceptions to their own file in production
    winston.handleExceptions(new DailyRotateFile({
      filename: this.config.folders.logs + '/exceptions.log',
      tailable: true
    }));
  }

  // Setup logging app
  this.log = require('./setup/logs')(this.config);
  // Setup internal framework logger so we can tell if its an app or framework erro
  this.log._ceres = require('./setup/logs')(this.config, 'ceres');
  this.log._ceres.silly('Logging setup');

  // Bind the correct context
  if (this.config.folders.middleware) {
    this.config.middleware = Setup.directory(this.config.folders.middleware, {
      config: this.config
    });
  }

  /**
   * Base Rest Controller API
   *
   * @type {Object}
   */
  this.Rest = {

    /**
     * Base Controller
     *
     * @type {Object}
     */
    Controller: require(path.resolve(__dirname + '/rest/Controller')),

    /**
     * Base Model
     *
     * @type {Object}
     */
    Model: require(path.resolve(__dirname + '/rest/models/' + this.config.db.type))
  };

  this.Pipeline = require(path.resolve(__dirname + '/render/Pipeline'));

  // Bind the correct context
  this.Pipeline.create = this.Pipeline.create.bind(this);
  this.Rest.Controller.extend = this.Rest.Controller.extend.bind(this);
  this.Rest.Model.extend = this.Rest.Model.extend.bind(this);

  return new Promise(function(resolve, reject){
    this.log._ceres.silly('Setting up ' + this.config.db.type);
    var Database = require(__dirname + '/db')(this.config, this);
    return Database.then(function(db){
        this.Database = db;
        return this;
      }.bind(this))
      .then(resolve)
      .catch(function(err){
        this.log._ceres.error(err)
        reject(err);
      });
  }.bind(this));
}

module.exports = Ceres
