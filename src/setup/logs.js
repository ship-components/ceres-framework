var winston = require('winston');
var mkdirp = require('mkdirp');

var DefaultSettings = {
	production: {
		name: 'production',
		timestamp: true,
		tailable: true
	},
	error: {
		name: 'errors',
		level: 'error',
		timestamp: true,
		tailable: true
	},
	console: {
		level: 'silly',
		colorize: true,
		prettyPrint: true,
		timestamp: true,
		depth: 4
	}
};

/**
 * Setup a new category
 * @type    {[type]}
 */
module.exports.logger = function logger(config, name) {
	name = name || config.name;

	// Return if we're already setup
	if (winston.loggers.has(name)) {
		return winston.loggers.get(name);
	} else {
		/**
		 * App specific transports
		 * @type    {Array}
		 */
		var transports = [
			// Should probably be kept for 30 days
			new winston.transports.File(Object.assign({}, DefaultSettings.production, {
				filename: config.folders.logs + '/production.log',
				level: config.logLevel || 'info',
				label: name
			})),
			// Log errors to a separate file
			new winston.transports.File(Object.assign({}, DefaultSettings.errors, {
				filename: config.folders.logs + '/errors.log',
				label: name
			}))
		];

		// Output to console on dev
		if (config.env !== 'production' || config.verbose) {
			transports.push(new winston.transports.Console(Object.assign({}, DefaultSettings.console, {
				level: config.logLevel || 'silly',
				label: name
			})));
		}

		return winston.loggers.add(name, {
			transports: transports
		});
	}
};


/**
 * Setup winston
 * @param    {Ceres}    ceres
 * @return   {Undefined}
 */
module.exports.init = function(ceres) {

	// Make sure the folder exists
	mkdirp.sync(ceres.config.folders.logs);

	/**
	 * Framework transports. Pretty much the only different thing is how errors
	 * are captured
	 * @type    {Array}
	 */
	var transports = [
		// Should probably be kept for 30 days
		new winston.transports.File(Object.assign({}, DefaultSettings.production, {
			filename: ceres.config.folders.logs + '/production.log',
			level: ceres.config.logLevel || 'info',
			label: 'ceres',
			handleExceptions: true,
			humanReadableUnhandledException: true
		})),
		// Log errors to a separate file
		new winston.transports.File(Object.assign({}, DefaultSettings.errors, {
			filename: ceres.config.folders.logs + '/errors.log',
			label: 'ceres',
			handleExceptions: true,
			humanReadableUnhandledException: true
		}))
	];

	// Output to console on dev
	if (ceres.config.env !== 'production' || ceres.config.verbose) {
		transports.push(new winston.transports.Console(Object.assign({}, DefaultSettings.console, {
			level: ceres.config.logLevel || 'silly',
			label: 'ceres',
			handleExceptions: true,
			humanReadableUnhandledException: true
		})));
	}

	// Apply
	winston.configure({
		transports: transports
	});

	// Setup internal framework logger so we can tell if its an app or framework erro
	winston.debug('Writing logs to %s', ceres.config.folders.logs);

	return winston;
};
