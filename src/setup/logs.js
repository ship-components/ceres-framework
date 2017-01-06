var winston = require('winston');

/**
 * Store loggers that have alread been setup
 * @type    {Object}
 */
var loggers = {};

module.exports = function setupLogger(config, name) {
  name = name || config.name;

  // Return if we're already setup
  if (loggers[name]){
    return loggers[name];
  }

  /**
   * Transports
   *
   * @type    {Object}
   */
  var transports = [
    // Should probably be kept for 30 days
    new(require('winston-daily-rotate-file'))({
      name: 'production',
      filename: config.folders.logs + '/production.log',
      label: name,
      level: config.logLevel || 'info',
      maxFiles: 30,
      timestamp: true,
      tailable: true
    })
  ];

  // Output to console on dev
  if (config.env !== 'production' || config.verbose) {
    transports.push(new(winston.transports.Console)({
      level: config.logLevel || 'silly',
      colorize: true,
      label: name,
      prettyPrint: true,
      timestamp: true,
      depth: 4
    }));
  }

  // Create
  var logger = new(winston.Logger)({
    transports: transports
  });

  // Save to cache
  loggers[name] = logger;

  return logger;
};
