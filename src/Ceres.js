/*******************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Framework constructor
 ******************************************************************************/

var path = require('path');
var Promise = require('bluebird');
var EventEmitter = require('events');
var cluster = require('cluster');

var Config = require('./setup/Config');
var setupCache = require('./setup/cache');
var setupLogs = require('./setup/logs');
var runStickyCluster = require('./setup/run-sticky-cluster');
var runCluster = require('./setup/run-cluster');
var runFork = require('./setup/run-fork');
var Pid = require('./lib/Pid');

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

  // Setup event emitter
  this._events = new EventEmitter();
  this.on = this._events.on.bind(this._events);
  this.removeListener = this._events.removeListener.bind(this._events);
  this.emit = this._events.emit.bind(this._events);

  this.on('configured', function(){
    if (typeof this.config.hashids === 'object' && this.config.HashIds !== null) {
      this.HashIds = this.HashIds.call(this, this);
    }
  }.bind(this));
}

/**
 * Placeholder for Database object
 * @type    {Object}
 */
Ceres.prototype.Database = {};

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
Ceres.prototype.HashIds = require(path.resolve(__dirname + '/lib/hashIds'));

/**
 * Alias cut to Pipeline
 */
Ceres.prototype.Pipeline = require(path.resolve(__dirname + '/render/Pipeline'));

/**
 * Alias to run
 */
Ceres.prototype.run = function run() {
  // Ensure secret is present
  if (!this.config.secret) {
    throw new Error('Unable to find secret.');
  }
  this.log._ceres.silly('Running application in %s mode', this.config.processManagement);
  if (this.config.processManagement === 'fork') {
    return runFork.call(this, this);
  } else if (this.config.processManagement === 'sticky-cluster') {
    return runStickyCluster.call(this, this);
  } else {
    return runCluster.call(this, this);
  }
};

/**
 * Connect to database and cache
 * @return {Promise}
 */
Ceres.prototype.connect = function() {
  if (typeof this.config !== 'object') {
    Promise.reject(new Error('Ceres has not been configured yet'));
    return;
  }

  var type = this.config.db.type;
  if (['bookshelf', 'rethinkdb', 'mongodb'].indexOf(type) === -1) {
    this.log._ceres.debug('Skipping database setup');
    return setupCache(this)
      .then(function(cache){
        this.Cache = cache;
        return this;
      }.bind(this));
  }

  this.log._ceres.silly('Connecting to %s...', type);

  var databaseStartTime = Date.now();

  // Expose these for any help function
  if (type === 'bookshelf') {
    this.Model.Bookshelf = require('./models/types/BookshelfModel');
  } else if (type === 'rethinkdb') {
    this.Model.Rethinkdb = require('./models/types/RethinkdbModel');
  } else if (type === 'mongodb') {
    this.Model.Mongodb = require('./models/types/MongodbModel');
  }

  var connect = require(__dirname + '/db')(this.config, this);

  return connect.then(function(db){
    var databaseStartupTime = Date.now() - databaseStartTime;
    this.log._ceres.info('Connected to %s - %ss', type, (databaseStartupTime / 1000).toLocaleString(), {
      duration: databaseStartupTime
    });
    this.Database = db;
    return setupCache(this);
  }.bind(this))
    .then(function(cache){
      this.Cache = cache;
      return this;
    }.bind(this));
};

/**
 * Configure application
 * @param  {Object} options External options
 * @return {Promise}
 */
Ceres.prototype.configure = function(options) {
  return new Promise(function(resolve, reject){
    const startTime = Date.now();
    try {
      // Bootstrap config
      this.config = new Config(options);
    } catch (err) {
      reject(err);
      return;
    }

    // Bind config and allow custom loggers
    this.logger = setupLogs.logger.bind(this, this.config);

    // Setup default app logger
    this.log = this.logger();

    // Setup internal logger
    this.log._ceres = setupLogs.init(this);
    this.log._ceres.info('Starting %s...', this.config.name || 'application');
    this.log._ceres.info('Writing logs to %s', this.config.folders.logs);

    // Log SIGTERM exit events
    process.on('SIGTERM', (code) => {
      this.log._ceres.info('Received SIGTERM; exiting...');
      process.exit(code);
    });

    this.emit('configured');
    var duration = (Date.now() - startTime);
    this.log._ceres.info('"%s" configuration loaded - %ss', this.config.env, (duration / 1000).toLocaleString(), { duration });

    // Check to see if this process is a child. Children do not need pid files as the parent handles that
    this.isMaster = Boolean(cluster.isMaster || (this.config.processManagement === 'fork' && !process.env.CERES_UNIQUE_ID));

    if (this.isMaster && this.config.pid && !options.disablePid) {
      // Setup Pid if we're configure
      this.pid = new Pid(this.config.pid);
      this.pid.on('created', (pid) => {
        this.log._ceres.info('Wrote pid to %s - %s', pid.options.path, pid.id);
        resolve(this);
      });
      this.pid.on('error', reject);
    } else {
      resolve(this);
    }
  }.bind(this));
};

/**
 * Error handler
 * @param    {Error}    err
 */
function handleError(err) {
  // The logger may or may not be setup by the time this is called
  if (this.log && typeof this.log._ceres === 'object') {
    this.log._ceres.error(err);
  }

  // Always log to the stderr
  console.error(err.stack);

  // Make sure we exit with a non zero error code so we don't get stuck
  process.exit(1);
}

/**
 * Load the app
 * @deprecated
 * @param  {Object} options
 */
Ceres.prototype.load = function(options) {

  // Load is typically used for scripts which do not need a pid by default
  if (typeof options.disablePid !== 'boolean') {
    options.disablePid = true;
  }

  var instance = this;
  return instance
    .configure(options)
    .then(instance.connect)
    .then(function(ceres){
      this.emit('before:run');
      return ceres;
    }.bind(this))
    .catch(handleError.bind(this));
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
    .catch(handleError.bind(this));
};

module.exports = Ceres;
