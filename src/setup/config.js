/*******************************************************************************
 * Config
 *
 * @author       Isaac Suttell <isaac.suttell@sony.com>
 * @file         Load application settings
 ******************************************************************************/

// Modules
var fs = require('fs');
var path = require('path');
var merge = require('../lib/merge');

function Config(cli) {
	if (typeof cli !== 'object') {
		cli = {};
	}

  Object.assign(this, {
    configFolder: process.cwd() + '/config'
  }, cli);

  this.configFolder = path.resolve(this.configFolder);

	// Framework defaults
	var defaultConfig = require('../../config/default');

	// Get global config
	var config = this.requireConfig('default');

	// Get the environment
	var env = this.getEnv(cli, config);

	// Get env specific config
	var envConfig = this.requireConfig(env);

	// listen for the port as an environmental variable. If we see it, use it.
	if (process.env.PORT) {
		envConfig.port = parseInt(process.env.PORT, 10);
	}

	// Get the location of the machine config file
	var rcPath = this.getRCPath([cli, envConfig, config]);

	// Get machine specific settings
	var rc = this.rcConfig(rcPath);

	// Merge config sources together
	config = merge({}, defaultConfig, config, envConfig, rc, cli);

	config.rc = rcPath;

	// Resolve all paths
	for (var folder in config.folders) {
		if (config.folders.hasOwnProperty(folder)) {
			config.folders[folder] = path.resolve(config.folders[folder]);
		}
	}

  // Grab webpack config if we have it
	config.webpackConfig = this.getWebpack(env);

  // Assign to this
	Object.assign(this, config);

  return this;
}

/**
 * Read the config RC File
 *
 * @param     {Object}    options
 * @return    {Object}
 */
Config.prototype.rcConfig = function rcConfig(file) {
	file = path.resolve(file || '.configrc');

	// Must exist
	fs.accessSync(file);

	// Read
	var rc = fs.readFileSync(file, {
		encoding: 'utf8'
	});

	// Convert to JS
	rc = JSON.parse(rc);

	return rc;
};

/**
 * Get the env
 * @param    {Object}    cli
 * @param    {Object}    config
 * @return   {String}
 */
Config.prototype.getEnv = function(cli, config) {
  if (typeof cli !== 'object') {
    throw new TypeError('cli is not an object');
  } else if (typeof config !== 'object') {
    throw new TypeError('config is not an object');
  }
  return [cli.env, config.env, process.env.NODE_ENV, 'production'].find(function(item){
		return typeof item === 'string';
	});
};

/**
 * Require a config file
 *
 * @param  {String} env
 * @return {Object}
 */
Config.prototype.requireConfig = function requireConfig(env) {
	env = env || 'default';
	var fileName = this.configFolder + '/' + env + '.js';
	try {
		fs.accessSync(fileName);
	} catch(accessError) {
    // Can't find the file
		return {};
	}
  // Import
  var conf = require(fileName);

  // If its a function call it. We can use it to isolate scope if we want
  if (typeof conf === 'function') {
    conf = conf(this);
  }

  if (typeof conf === 'object') {
    return conf;
  } else {
    throw new TypeError(fileName + ' does not export an object or function that returns an object');
  }
};

/**
 * Grab the path to the machine config
 * @param    {Array<Object>}    configs
 * @return   {String}
 */
Config.prototype.getRCPath = function getRCPath(configs) {
	var config = configs.find(function(conf){
		return typeof conf === 'object' && conf.rc;
	});
	return config ? path.resolve(config.rc) : void 0;
};

/**
 * Search for webpack config
 * @param    {String}    env
 * @return   {Object}
 */
Config.prototype.getWebpack = function getWebpack(env) {
	var files = [process.cwd() + '/config/webpack' + env + '.js', process.cwd() + '/config/webpack.default.js', process.cwd() + '/config/webpack.config.js'];
	var index = files.length;
	while (--index > 0) {
		try {
			fs.accessSync(files[index]);
			return require(files[index]);
		} catch(accessError) {
			if (accessError.message.indexOf('ENOENT') !== 0) {
				throw accessError;
			}
		}
	}
	return {};
};

module.exports = Config;
