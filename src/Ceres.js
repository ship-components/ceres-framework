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
const Controller = require('./controllers/Controller');
const hashIds = require('./lib/hashIds');
const Pipeline = require('./render/Pipeline');
const ModelManager = require('./models/ModelManager');

/**
 * Ceres Event Names
 * @enum {string}
 */
const CeresEvents = {
  Configured: 'configured',
  Connected: 'connected',
  AfterSetup: 'after-setup',
};

/**
 * Ceres Framework wrapper for Express.js
 * @class
 * @namespace Ceres
 */
function Ceres() {
  this.startTime = process.hrtime();

  this.Model = ModelManager;

  // Bind and pass in this as an arg
  this.Controller = this.Controller.bind(this, this);
  // Ensure create has the right context
  this.Pipeline.create = this.Pipeline.create.bind(this);

  // Bind everything else just in case
  // eslint-disable-next-line no-restricted-syntax
  for (const key in this) {
    if (typeof this[key] === 'function') {
      this[key] = this[key].bind(this);
    }
  }

  /**
   * @type {typeof CeresEvents}
   */
  this.CeresEvents = CeresEvents;

  // Setup event emitter
  this.events = new EventEmitter();
  this.on = this.events.on.bind(this.events);
  this.removeListener = this.events.removeListener.bind(this.events);
  this.emit = this.events.emit.bind(this.events);

  this.on(CeresEvents.Configured, () => {
    if (typeof this.config.hashids === 'object' && this.config.HashIds !== null) {
      this.HashIds = this.HashIds.call(this, this);
    }
  });
}

/**
 * Ceres Configuration Options
 * @type { typeof import("../config/default") }
 * @memberof Ceres
 */
Ceres.prototype.config = {};

/**
 * Initialized Ceres Database
 * @type {{
 *   bookshelf: import('bookshelf')
 * }}
 * @memberof Ceres
 */
Ceres.prototype.database = {};

/**
 * Controller Factory
 * @memberof Ceres
 */
Ceres.prototype.Controller = Controller;

/**
 * Link to hashIds
 * @type    {Object}
 * @memberof Ceres
 */
Ceres.prototype.HashIds = hashIds;

/**
 * Alias to Pipeline
 * @memberof Ceres
 */
Ceres.prototype.Pipeline = Pipeline;

/**
 * Run Ceres
 * @memberof Ceres
 * @returns {Promise}
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
  if (typeof this.config !== 'object') {
    return Promise.reject(new Error('Ceres has not been configured yet'));
  }

  const { type } = this.config.db;
  if (['bookshelf'].indexOf(type) === -1) {
    this.log.internal.debug('Skipping database setup');
    return setupCache(this).then(cache => {
      this.Cache = cache;
      this.emit(CeresEvents.Connected);
      return this;
    });
  }

  this.log.internal.silly('Connecting to %s...', type);

  const databaseStartTime = Date.now();

  const connection = require(`${__dirname}/db`)(this.config, this);

  return connection
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
      this.database = db;
      return setupCache(this);
    })
    .then(cache => {
      this.Cache = cache;
      if (this.databaseCallback) {
        this.databaseCallback(this);
      }
      this.emit(CeresEvents.Connected);
      return this;
    });
};

/**
 * Configure Ceres
 * @param  { import("../config/default")} options External options
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
        this.config = new Config(options).toObject();
      } catch (err) {
        reject(err);
        return;
      }
    }

    /**
     * @type { import("./setup/logs").WinstonLoggerFactory }
     */
    this.logger = setupLogs.logger.bind(this, this.config);

    /**
     * @type { import("./setup/logs").InternalLogger }
     */
    // @ts-ignore
    this.log = this.logger();

    /**
     * Internal Logger
     * @type { import("./setup/logs").WinstonLogger }
     */
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
      process.on('SIGTERM', () => {
        this.log.internal.info(
          '%s process %s received SIGTERM; exiting...',
          this.isMaster ? 'Master' : 'Child',
          process.pid,
          {
            isMaster: this.isMaster,
            pid: process.pid,
          }
        );
        process.exit();
      });
    }

    this.emit(CeresEvents.Configured);
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
  this.databaseCallback = factory;
  return this;
};

/**
 * @type {boolean} Check to see if Ceres has loaded its configure and optionally connected to the database
 */
Ceres.prototype.initialized = false;

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
      this.initialized = true;
      this.emit(CeresEvents.AfterSetup);
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
      this.initialized = true;
      this.emit(CeresEvents.AfterSetup);
      return ceres;
    })
    .then(command.bind(this, this))
    .catch(handleError.bind(this));
};

module.exports = Ceres;
