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

/**
 * Verbose Levels
 *
 * @constants
 * @type    {Object}
 */
var VerboseLevel = {
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
function readRc(options) {
  options = _.extend({
    rc: path.resolve('.apprc')
  }, options);

  var rc;
  try {

    if (!fs.existsSync(options.rc)) {
      throw new Error('Unable to find ' + options.rc);
    }

    rc = fs.readFileSync(options.rc, {
      encoding: 'utf8'
    });

    try {
      rc = JSON.parse(rc);
    } catch (err) {
      throw new Error('Unable to parse ' + options.rc);
    }

    return rc;
  } catch (err) {
    return {};
  }
}

/**
 * Ensure these settings are set
 *
 * @type    {Object}
 */
var defaultOptions = {
  rc: path.resolve('.apprc'),
  env: process.env.NODE_ENV || 'production',
  port: process.env.PORT || 3000,
  instances: require('os').cpus().length,
  'disable-sso': false
};

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
  verbose: [Number, Boolean],
  'disable-sso': Boolean
}, {
  'e': '--env',
  'i': '--instances',
  'p': '--port',
  'v': '--verbose',
  'vv': '--verbose 2'
}, process.argv, 2);

// Get the command
if (['run', 'init'].indexOf(cli.argv.remain[0]) > -1) {
  cli.command = cli.argv.remain[0];
}

module.exports.extend = function(config) {

  // Ensure secret isn't being saved to repo
  if (config.secret) {
    console.warn('Secret should not be saved in the config file');
    process.exit();
  }

  // Read machine settings
  var rc = readRc(config);

  // Extend
  config = _.extend(config, rc, cli);

  // Let the app know we're booted
  config.bootstrapped = true;

  // Ensure secret is present
  if (!config.secret) {
    console.error('Unable to find secret');
    process.exit();
  }

  // Resolve all paths
  for (var folder in config.folders) {
    if (config.folders.hasOwnProperty(folder)) {
      config.folders[folder] = path.resolve(config.folders[folder]);
    }
  }

  if (config.verbose > VerboseLevel.VERBOSE_DEFAULT) {
    console.info('Bootstrap Successful');
  }

  return config;

};
