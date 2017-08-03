var winston = require('winston');
var mkdirp = require('mkdirp');

/**
 * Default settings for diffent transports
 * @type    {Object}
 */
var DefaultSettings = {
  production: {
    timestamp: true,
    tailable: true
  },
  error: {
    level: 'error',
    timestamp: true,
    tailable: true
  },
  console: {
    level: 'silly',
    colorize: true,
    prettyPrint: true,
    timestamp: true,
    depth: 5
  }
};

/**
 * Setup transports for a logger
 * @param    {Object}    config
 * @param    {String}    name
 * @return   {Array<Object>}
 */
function setupTransports(config, name, options) {
  // Ensure we're an object
  options = options || {};

  /**
   * Winston specific transports
   * @type    {Array}
   */
  var transports = [];

  /**
   * Level to log. Defaults to info. Can be overriden by the cli
   * @type    {String}
   */
  var productionLogLevel = config.logLevel || 'info';

  // Setup json logs for machines to ingest
  if (config.logging.json) {
    transports.push(
      new winston.transports.File(Object.assign({}, DefaultSettings.production, options, {
        name: 'production-json',
        filename: config.folders.logs + '/production.json',
        level: productionLogLevel,
        label: name,
        json: true
      }))
    );

    // Log errors to a separate file
    transports.push(
      new winston.transports.File(Object.assign({}, DefaultSettings.errors, options, {
        name: 'errors-json',
        filename: config.folders.logs + '/errors.json',
        label: name,
        json: true
      }))
    );
  }

  // Setup human readable logs
  if (config.logging.human) {
    transports.push(
      new winston.transports.File(Object.assign({}, DefaultSettings.production, options, {
        name: 'production',
        filename: config.folders.logs + '/production.log',
        level: productionLogLevel,
        label: name,
        json: false
      }))
    );
    // Log errors to a separate file
    transports.push(
      new winston.transports.File(Object.assign({}, DefaultSettings.errors, options, {
        name: 'errors',
        filename: config.folders.logs + '/errors.log',
        label: name,
        json: false
      }))
    );
  }

  // Output to console on dev
  if (config.env !== 'production' || config.verbose) {
    transports.push(new winston.transports.Console(Object.assign({}, DefaultSettings.console, options, {
      level: config.logLevel || 'silly',
      label: name
    })));
  }

  return transports;
}

/**
 * Setup a new category
 * @type    {[type]}
 */
module.exports.logger = function logger(config, name) {
  name = name || config.name;

  // Return if we're already setup
  if (winston.loggers.has(name)) {
    return winston.loggers.get(name);
  }

  winston.silly('Configuring logger %s...', name);

  return winston.loggers.add(name, {
    transports: setupTransports(config, name)
  });
};


/**
 * Setup winston. Called once on startup and setups up internal logger for the
 * framework. User loggers are handled by the logger function
 * @param    {Ceres}    ceres
 * @return   {Undefined}
 */
module.exports.init = function(ceres) {
  // Make sure the folder exists
  mkdirp.sync(ceres.config.folders.logs);

  // Apply
  winston.configure({
    transports: setupTransports(ceres.config, 'ceres', {
      // Let the top level container handle exceptions
      handleExceptions: true,
      humanReadableUnhandledException: true
    })
  });

  winston.silly('Writing logs to %s', ceres.config.folders.logs);

  return winston;
};
