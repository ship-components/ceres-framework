/*******************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Framework constructor
 ******************************************************************************/

var path = require('path');
var winston = require('winston');
var DailyRotateFile = require('winston-daily-rotate-file');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var EventEmitter = require('events');

var setupConfig = require('./setup/config');

function Ceres() {
  this.startTime = process.hrtime();

  // Bind and pass in this as an arg
  this.Controller = this.Controller.bind(this, this);
  this.Model = this.Model.bind(this, this);
  // Ensure create has the right context
  this.Pipeline.create = this.Pipeline.create.bind(this);

  // Bind everything else just in case
  for (var key in this) {
    if (typeof this[key] === 'function') {
      this[key] = this[key].bind(this);
    }
  }

  // Expose these for any help function
  this.Model.Bookshelf = require('./models/types/bookshelf');
  this.Model.Rethinkdb = require('./models/types/rethinkdb');
	// Setup event emitter
	this._events = new EventEmitter();
	this.on = this._events.on;
	this.removeListener = this._events.removeListener;
	this.emit = this._events.emit;

  this.config = {};
	this.on('configured', function(){
		this.HashIds = this.HashIds.call(this, this);
	}.bind(this));
}

/**
 * Make contoller available at base level
 */
Ceres.prototype.Controller = require(path.resolve(__dirname + '/controllers/Controller'));

/**
 * Make the model available at the base level
 */
Ceres.prototype.Model = require(path.resolve(__dirname + '/models/Model'));

/**
 * Link to hashIds
 * @type    {Object}
 */
Ceres.prototype.HashIds = require(path.resolve(__dirname + '/lib/HashIds'));

/**
 * Alias cut to Pipeline
 */
Ceres.prototype.Pipeline = require(path.resolve(__dirname + '/render/Pipeline'));

/**
 * Alias to run
 */
Ceres.prototype.run = require(path.resolve(__dirname + '/setup/run'));

/**
 * Connect to database
 * @return {Promise}
 */
Ceres.prototype.connect = function() {
  return new Promise(function(resolve, reject){
    if (this.config.db.type === 'none') {
      resolve();
      return;
    }
    this.log._ceres.silly('Setting up ' + this.config.db.type);
    var connect = require(__dirname + '/db')(this.config, this);
    return connect.then(function(db){
        this.Database = db;
        return this;
      }.bind(this))
      .then(resolve)
      .catch(reject);
  }.bind(this));
};

/**
 * Configure application
 * @param  {Object} options External options
 * @return {Promise}
 */
Ceres.prototype.configure = function(options) {
  return new Promise(function(resolve, reject){
    try {
      // Bootstrap config
      this.config = setupConfig(options);
    } catch (err) {
      reject(err);
    }

    // Setup logging as well
    this.setupLogs()
			.then(function(){
				this.emit('configured');
				return this;
			}.bind(this))
      .then(resolve)
      .catch(reject);
  }.bind(this));
};

/**
 * Setup Logging
 * @return {Promise}
 */
Ceres.prototype.setupLogs = function() {
  return new Promise(function(resolve, reject){
    try {
      // Make sure the folder exists
      mkdirp.sync(this.config.folders.logs);

      if (this.config.env === 'production') {
        // Save uncaught exceptions to their own file in production
        winston.handleExceptions(new DailyRotateFile({
          filename: this.config.folders.logs + '/exceptions.log',
          tailable: true
        }));
      }

      // Bind config and allow custom loggers
      this.logger = require('./setup/logs').bind(this, this.config);

      // Setup default logging
      this.log = this.logger();

      // Setup internal framework logger so we can tell if its an app or framework erro
      this.log._ceres = this.logger('ceres');

      this.log._ceres.silly('Writing logs to %s', this.config.folders.logs);
      resolve();
    } catch (err) {
      reject(err);
    }
  }.bind(this));
};

/**
 * Load the app
 * @deprecated
 * @param  {Object} options
 */
Ceres.prototype.load = function(options) {
  var instance = this;
  return instance
    .configure(options)
    .then(instance.connect)
		.then(function(ceres){
			this.emit('before:run');
			return ceres;
		}.bind(this))
    .catch(function(err){
      if (instance.log) {
        instance.log._ceres.error(err);
      } else {
        console.error(err.stack);
      }
    });
};

/**
 * Load the app
 * @param  {Object} options
 */
Ceres.prototype.exec = function(command, options) {
  var instance = this;
  return instance
    .configure(options)
		.then(function(ceres){
			this.emit('before:run');
			return ceres;
		}.bind(this))
    .then(command.bind(this, this))
    .catch(function(err){
      if (instance.log) {
        instance.log._ceres.error(err);
      } else {
        console.error(err.stack);
      }
    });
};

module.exports = Ceres;
