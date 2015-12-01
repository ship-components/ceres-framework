/*******************************************************************************
 * bootstrap
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Load application settings
 ******************************************************************************/

// Modules
var nopt = require('nopt');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

/**
 * Verbose Levels
 *
 * @constants
 * @type    {Object}
 */
var VerboseLevel = module.exports.VerboseLevel = {
  'VERBOSE_DEFAULT': 0,
  'VERBOSE_NORMAL': 1,
  'VERBOSE_ALL': 2,
};

/**
 * Read the config RC File
 *
 * @param     {Object}    options
 * @return    {Object}
 */
function rcConfig(file) {
  file = path.resolve(file || '.configrc');

  try {

    // Must exist
    if (!fs.existsSync(file)) {
      throw new Error('Unable to find ' + file);
    }

    // Read
    var rc = fs.readFileSync(file, {
      encoding: 'utf8'
    });

    // Convert to JS
    rc = JSON.parse(rc);

    return rc;
  } catch (err) {
    return {};
  }
}

/**
 * Get options from the command line
 *
 * @return {Object}
 */
function cliConfig() {
  /**
   * Get options from the command line
   *
   * @type    {Object}
   */
  var cli = nopt({
    rc: path,
    env: String,
    instances: Number,
    port: Number,
    config: path,
    debug: Boolean,
    verbose: [Number, Boolean]
  }, {
    'e': '--env',
    'i': '--instances',
    'p': '--port',
    'd': '--debug',
    'v': '--verbose',
    'vv': '--verbose 2',
    'c': '--rc'
  }, process.argv, 2);

  // Get the command
  cli.command = cli.argv.remain[0];

  return cli;
}

/**
 * Require a config file
 *
 * @param  {String} env
 * @return {Object}
 */
function requireConfig(env) {
  env = env || 'default';
  try {
    return require(process.cwd() + '/config/' + env + '.js');
  } catch(err) {
    return null;
  }
}

function getRCPath(configs) {
  var config = _.find(configs, function(conf){
    return _.isObject(conf) && conf.rc;
  });
  return config ? path.resolve(config.rc) : void 0;
}

module.exports = function() {
  // Framework defaults
  var defaultConfig = require('../../config/default');

  // Get global config
  var config = requireConfig();

  // Get config from cli
  var cli = cliConfig();

  // Get the environment
  var env = _.detect([cli.env, config.env, process.env.NODE_ENV, 'production'], function(env){
    return _.isString(env);
  });

  // Get env specific config
  var envConfig = requireConfig(env);

  var rcPath = getRCPath([cli, envConfig, config]);

  // Get machine specific settings
  var rc = rcConfig(rcPath);

  // Merge config sources together
  config = _.merge(defaultConfig, config, envConfig, rc, cli);
  config.rc = rcPath;

  // Resolve all paths
  for (var folder in config.folders) {
    if (config.folders.hasOwnProperty(folder)) {
      config.folders[folder] = path.resolve(config.folders[folder]);
    }
  }
  return config;
};
