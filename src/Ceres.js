/** *****************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Framework constructor
 ***************************************************************************** */

const path = require('path');
const Promise = require('bluebird');
const EventEmitter = require('events');
const cluster = require('cluster');

const Config = require('./setup/Config');
const setupCache = require('./setup/cache');
const setupLogs = require('./setup/logs');
const runStickyCluster = require('./setup/run-sticky-cluster');
const runCluster = require('./setup/run-cluster');
const runFork = require('./setup/run-fork');
const Pid = require('./lib/Pid');

function Ceres() {
  this.startTime = process.hrtime();

  // Bind and pass in this as an arg
  this.Controller = this.Controller.bind(this, this);
  this.Model = this.Model.bind(this, this);
  // Ensure create has the right context
  this.Pipeline.create = this.Pipeline.create.bind(this);

  // Bind everything else just in case
  for (const key in this) {
    if (typeof this[key] === 'function') {
      this[key] = this[key].bind(this);
    }
  }

  // Setup event emitter
  this._events = new EventEmitter();
  this.on = this._events.on.bind(this._events);
  this.removeListener = this._events.removeListener.bind(this._events);
  this.emit = this._events.emit.bind(this._events);

  this.on(
    'configured',
    function() {
      if (typeof this.config.hashids === 'object' && this.config.HashIds !== null) {
        this.HashIds = this.HashIds.call(this, this);
      }
    }.bind(this)
  );
}

/**
 * Placeholder for Database object
 * @type    {Object}
 */
Ceres.prototype.Database = {};

/**
 * Make contoller available at base level
 */
Ceres.prototype.Controller = require(path.resolve(`${__dirname}/controllers/Controller`));

/**
 * Make the model available at the base level
 */
Ceres.prototype.Model = require(path.resolve(`${__dirname}/models/Model`));

/**
 * Link to hashIds
 * @type    {Object}
 */
Ceres.prototype.HashIds = require(path.resolve(`${__dirname}/lib/hashIds`));

/**
 * Alias cut to Pipeline
 */
Ceres.prototype.Pipeline = require(path.resolve(`${__dirname}/render/Pipeline`));

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
  }
  if (this.config.processManagement === 'sticky-cluster') {
    return runStickyCluster.call(this, this);
  }
  return runCluster.call(this, this);
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
  if (this._databaseFactory) {
    this.log._ceres.info('Using external database factory');
    return new this._databaseFactory(this.config).then(results => {
      Object.assign(this, results);
      return this;
    });
  }

  const type = this.config.db.type;
  if (['bookshelf', 'rethinkdb', 'mongodb'].indexOf(type) === -1) {
    this.log._ceres.debug('Skipping database setup');
    return setupCache(this).then(
      function(cache) {
        this.Cache = cache;
        return this;
      }.bind(this)
    );
  }

  this.log._ceres.silly('Connecting to %s...', type);

  const databaseStartTime = Date.now();

  // Expose these for any help function
  if (type === 'bookshelf') {
    this.Model.Bookshelf = require('./models/types/BookshelfModel');
  } else if (type === 'rethinkdb') {
    this.Model.Rethinkdb = require('./models/types/RethinkdbModel');
  } else if (type === 'mongodb') {
    this.Model.Mongodb = require('./models/types/MongodbModel');
  }

  const connect = require(`${__dirname}/db`)(this.config, this);

  return connect
    .then(
      function(db) {
        const databaseStartupTime = Date.now() - databaseStartTime;
        this.log._ceres.info(
          'Connected to %s - %ss',
          type,
          (databaseStartupTime / 1000).toLocaleString(),
          {
            duration: databaseStartupTime,
          }
        );
        this.Database = db;
        return setupCache(this);
      }.bind(this)
    )
    .then(
      function(cache) {
        this.Cache = cache;
        return this;
      }.bind(this)
    );
};

/**
 * Configure application
 * @param  {Object} options External options
 * @return {Promise}
 */
Ceres.prototype.configure = function(options) {
  return new Promise(
    function(resolve, reject) {
      const startTime = Date.now();
      if (options instanceof Config) {
        this.config = options;
      } else {
        try {
          // Bootstrap config
          this.config = new Config(options);
        } catch (err) {
          reject(err);
          return;
        }
      }

      // Bind config and allow custom loggers
      this.logger = setupLogs.logger.bind(this, this.config);

      // Setup default app logger
      this.log = this.logger();

      // Setup internal logger
      this.log._ceres = setupLogs.init(this);

      // Check to see if this process is a child. Children do not need pid files as the parent handles that
      this.isMaster =
        this.config.processManagement === 'fork'
          ? typeof process.env.CERES_UNIQUE_ID !== 'string'
          : cluster.isMaster;

      this.log._ceres.info('Starting %s...', this.config.name || 'ceres', {
        isMaster: this.isMaster,
        pid: process.pid,
      });
      this.log._ceres.info('Writing logs to %s', this.config.folders.logs);

      // Fork mode handles this separatly
      if (this.config.processManagement !== 'fork') {
        // Log SIGTERM exit events
        process.on('SIGTERM', code => {
          this.log._ceres.info(
            '%s process %s received SIGTERM; exiting...',
            this.isMaster ? 'Master' : 'Child',
            process.pid,
            {
              isMaster: this.isMaster,
              pid: process.pid,
            }
          );
          process.exit(code);
        });
      }

      this.emit('configured');
      const duration = Date.now() - startTime;
      this.log._ceres.info(
        '"%s" configuration loaded - %ss',
        this.config.env,
        (duration / 1000).toLocaleString(),
        { duration }
      );

      if (this.isMaster && this.config.pid && !options.disablePid) {
        // Setup Pid if we're configure
        this.pid = new Pid(this.config.pid);
        this.pid.on('created', pid => {
          this.log._ceres.info('Wrote pid to %s - %s', pid.options.path, pid.id);
          resolve(this);
        });
        this.pid.on('existing', (existingPid, currentPid) => {
          this.log._ceres.warn(
            'Found an another active process at %s. Attempting to shut it down...',
            existingPid,
            {
              existingPid,
              pid: currentPid,
            }
          );
        });
        this.pid.on('removed', pid => {
          this.log._ceres.debug('Process exiting. Removed pid file %s', pid.options.path, {
            pid: pid.id,
          });
        });
        this.pid.on('error', reject);
      } else {
        resolve(this);
      }
    }.bind(this)
  );
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
 * Store the database factory for later
 */
Ceres.prototype.database = function(factory) {
  this._databaseFactory = factory;
  return this;
};

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

  const instance = this;
  return instance
    .configure(options)
    .then(instance.connect)
    .then(
      function(ceres) {
        this.emit('before:run');
        return ceres;
      }.bind(this)
    )
    .catch(handleError.bind(this));
};

/**
 * Load the app
 * @param  {Object} options
 */
Ceres.prototype.exec = function(command, options) {
  const instance = this;
  return instance
    .configure(options)
    .then(
      function(ceres) {
        this.emit('before:run');
        return ceres;
      }.bind(this)
    )
    .then(command.bind(this, this))
    .catch(handleError.bind(this));
};

module.exports = Ceres;
