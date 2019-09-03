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
  // eslint-disable-next-line no-restricted-syntax
  for (const key in this) {
    if (typeof this[key] === 'function') {
      this[key] = this[key].bind(this);
    }
  }

  // Setup event emitter
  this.events = new EventEmitter();
  this.on = this.events.on.bind(this.events);
  this.removeListener = this.events.removeListener.bind(this.events);
  this.emit = this.events.emit.bind(this.events);

  this.on('configured', () => {
    if (typeof this.config.hashids === 'object' && this.config.HashIds !== null) {
      this.HashIds = this.HashIds.call(this, this);
    }
  });
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
  this.log.internal.silly('Running application in %s mode', this.config.processManagement);
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
Ceres.prototype.connect = function connect() {
  if (this.connected === true) {
    return Promise.resolve(this);
  }

  if (typeof this.config !== 'object') {
    return Promise.reject(new Error('Ceres has not been configured yet'));
  }

  const { type } = this.config.db;
  if (['bookshelf', 'rethinkdb', 'mongodb'].indexOf(type) === -1) {
    this.log.internal.debug('Skipping database setup');
    return Promise.bind(this)
      .then(() => {
        return setupCache(this);
      })
      .then(cache => {
        this.Cache = cache;
        return this;
      })
      .then(() => {
        this.connected = true;
        this.emit('connected');
      });
  }

  this.log.internal.silly('Connecting to %s...', type);

  const databaseStartTime = Date.now();

  // Expose these for any help function
  if (type === 'bookshelf') {
    this.Model.Bookshelf = require('./models/types/BookshelfModel');
  } else if (type === 'rethinkdb') {
    this.Model.Rethinkdb = require('./models/types/RethinkdbModel');
  } else if (type === 'mongodb') {
    this.Model.Mongodb = require('./models/types/MongodbModel');
  }

  const connection = require(`${__dirname}/db`);

  return Promise.bind(this)
    .then(() => connection(this.config, this))
    .then(db => {
      const databaseStartupTime = Date.now() - databaseStartTime;
      this.log.internal.info(
        'Connected to %s - %ss',
        type,
        (databaseStartupTime / 1000).toLocaleString(),
        {
          duration: databaseStartupTime,
        }
      );
      this.Database = db;
      return setupCache(this);
    })
    .then(cache => {
      this.Cache = cache;
      return this;
    })
    .then(() => {
      this.connected = true;
      this.emit('connected');
    })
    .then(() => {
      if (this.DatabaseFactory) {
        this.log.internal.info('Using external database factory');
        return Promise.resolve(this.DatabaseFactory(this.config));
      }
      return this;
    });
};

/**
 * Configure application
 * @param  {Object} options External options
 * @return {Promise}
 */
Ceres.prototype.configure = function configure(options) {
  return new Promise((resolve, reject) => {
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
    this.log.internal = setupLogs.init(this);

    // Check to see if this process is a child. Children do not need pid files as the parent handles that
    this.isMaster =
      this.config.processManagement === 'fork'
        ? typeof process.env.CERES_UNIQUE_ID !== 'string'
        : cluster.isMaster;

    this.log.internal.info('Starting %s...', this.config.name || 'ceres', {
      isMaster: this.isMaster,
      pid: process.pid,
    });
    this.log.internal.info('Writing logs to %s', this.config.folders.logs);

    // Fork mode handles this separatly
    if (this.config.processManagement !== 'fork') {
      // Log SIGTERM exit events
      process.on('SIGTERM', code => {
        this.log.internal.info(
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
    this.log.internal.info(
      '"%s" configuration loaded - %ss',
      this.config.env,
      (duration / 1000).toLocaleString(),
      { duration }
    );

    if (this.isMaster && this.config.pid && !options.disablePid) {
      // Setup Pid if we're configure
      this.pid = new Pid(this.config.pid);
      this.pid.on('created', pid => {
        this.log.internal.info('Wrote pid to %s - %s', pid.options.path, pid.id);
        resolve(this);
      });
      this.pid.on('existing', (existingPid, currentPid) => {
        this.log.internal.warn(
          'Found an another active process at %s. Attempting to shut it down...',
          existingPid,
          {
            existingPid,
            pid: currentPid,
          }
        );
      });
      this.pid.on('removed', pid => {
        this.log.internal.debug('Process exiting. Removed pid file %s', pid.options.path, {
          pid: pid.id,
        });
      });
      this.pid.on('error', reject);
    } else {
      resolve(this);
    }
  });
};

/**
 * Error handler
 * @param    {Error}    err
 */
function handleError(err) {
  // The logger may or may not be setup by the time this is called
  if (this.log && typeof this.log.internal === 'object') {
    this.log.internal.error(err);
  }

  // Always log to the stderr
  console.error(err.stack);

  // Make sure we exit with a non zero error code so we don't get stuck
  process.exit(1);
}

/**
 * Store the database factory for later
 */
Ceres.prototype.database = function database(factory) {
  this.DatabaseFactory = factory;
  return this;
};

/**
 * Load the app
 * @deprecated
 * @param  {Object} options
 */
Ceres.prototype.load = function load(options) {
  // Load is typically used for scripts which do not need a pid by default
  if (typeof options.disablePid !== 'boolean') {
    options.disablePid = true;
  }

  const instance = this;
  return instance
    .configure(options)
    .then(instance.connect)
    .then(ceres => {
      this.emit('before:run');
      return ceres;
    })
    .catch(handleError.bind(this));
};

/**
 * Load the app
 * @param  {Object} options
 */
Ceres.prototype.exec = function exec(command, options) {
  const instance = this;
  return instance
    .configure(options)
    .then(ceres => {
      this.emit('before:run');
      return ceres;
    })
    .then(command.bind(this, this))
    .catch(handleError.bind(this));
};

module.exports = Ceres;
