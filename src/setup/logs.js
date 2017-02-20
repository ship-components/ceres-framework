var winston = require('winston');
var DailyRotateFile = require('winston-daily-rotate-file');
var mkdirp = require('mkdirp');

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

	// Make sure the folder exists
	mkdirp.sync(config.folders.logs);

	// Save uncaught exceptions to their own file in production
	winston.handleExceptions(new DailyRotateFile({
		name: 'exceptions',
		filename: this.config.folders.logs + '/exceptions.log',
		tailable: true,
		maxFiles: 30,
		timestamp: true
	}));

  /**
   * Transports
   *
   * @type    {Object}
   */
  var transports = [
    // Should probably be kept for 30 days
    new DailyRotateFile({
      name: 'production',
      filename: config.folders.logs + '/production.log',
      label: name,
      level: config.logLevel || 'info',
      maxFiles: 30,
      timestamp: true,
      tailable: true
    }),
		// Log errors to a separate file
		new DailyRotateFile({
			name: 'errors',
			filename: config.folders.logs + '/errors.log',
			label: name,
			level: 'error',
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

	logger.debug('%s logger configured', name);

  return logger;
};
