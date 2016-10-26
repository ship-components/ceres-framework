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

/**
 * Make contoller available at base level
 */
Ceres.prototype.Controller = require(path.resolve(__dirname + '/rest/Controller'));

/**
 * Make the model available at the base level
 */
Ceres.prototype.Model = require(path.resolve(__dirname + '/rest/Model'));

/**
 * Connect to database
 * @return {Promise}
 */
Ceres.prototype.connect = function() {
  this.log._ceres.silly('Setting up ' + this.config.db.type);
  var connect = require(__dirname + '/db')(this.config, this);
  return connect.then(function(db){
      this.Database = db;
      return this;
    }.bind(this));
}

/**
 * Configure application
 * @param  {Object} options External options
 * @return {Promise}
 */
Ceres.prototype.configure = function(options) {
  return new Promise(function(resolve, reject){
    try {
      // Bootstrap config
      this.config = Setup.config(options);
    } catch (err) {
      reject(err);
    }

    // Setup logging as well
    this.setupLogs()
      .then(resolve)
      .catch(reject);
  }.bind(this));
};

/**
 * Setup Logging
 * @return {Promise} [description]
 */
Ceres.prototype.setupLogs = function() {
  return new Promise(function(resolve, reject){
    try {
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

      this.log._ceres.silly('Logging configured');
      resolve();
    } catch (err) {
      reject(err);
    }
  }.bind(this));
};

/**
 * Configure middleware, Controllers, Models, Pipelines
 * @return {Promise}
 */
Ceres.prototype.setupModules = function() {
  return new Promise(function(resolve, reject){
    try {
      // Bind the correct context
      if (this.config.folders.middleware) {
        this.config.middleware = Setup.directory(this.config.folders.middleware, this);
        this.middleware = this.config.middleware;
        this.log._ceres.silly('Middleware configured');
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
        Controller: this.Controller,

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
      this.Rest.Model.extend = this.Rest.Model.extend.bind(this);

      this.log._ceres.silly('Rest module configured');
      resolve();
    } catch (err) {
      reject(err);
    }
  }.bind(this));
};

/**
 * Load the app
 * @param  {Object} options
 */
Ceres.prototype.load = function(options) {
  var instance = this;
  return instance
    .configure(options)
    .then(instance.setupModules)
    .then(instance.connect)
    .catch(function(err){
      if (instance.log) {
        instance.log._ceres.error(err);
      } else {
        console.error(err.stack);
      }
    });
}

/**
 * Load the app
 * @param  {Object} options
 */
Ceres.prototype.exec = function(command, options) {
  var instance = this;
  return instance
    .configure(options)
    .then(command.bind(this, this))
    .catch(function(err){
      if (instance.log) {
        instance.log._ceres.error(err);
      } else {
        console.error(err.stack);
      }
    });
}


module.exports = Ceres
