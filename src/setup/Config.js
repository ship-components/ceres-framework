/** *****************************************************************************
 * Config
 *
 * @author       Isaac Suttell <isaac.suttell@sony.com>
 * @file         Load application settings
 ***************************************************************************** */

// Modules
const fs = require('fs');
const path = require('path');
const merge = require('../lib/merge');

function Config(cli, options) {
  if (typeof cli !== 'object') {
    cli = {};
  }

  Object.assign(
    this,
    {
      configFolder: `${process.cwd()}/config`,
    },
    cli
  );

  this.configFolder = path.resolve(this.configFolder);

  // Framework defaults
  const defaultConfig = require(path.resolve(__dirname, '../../config/default'));

  // Get global config
  const appDefaultConfig = this.requireConfig('default');

  // Get the environment
  const envStr = this.getEnv(cli, appDefaultConfig);

  // Get env specific config
  const envConfig = this.requireConfig(envStr);

  // listen for the port as an environmental variable. If we see it, use it.
  // Used when in forking mode
  if (typeof process.env.PORT === 'string') {
    envConfig.port = parseInt(process.env.PORT, 10);
  }

  // Get the location of the machine config file
  const rcPath = this.getRCPath([cli, options, envConfig, appDefaultConfig, defaultConfig]);

  let rc = {};

  if (typeof rcPath === 'string') {
    // Get machine specific settings if we found a rc path
    rc = this.rcConfig(rcPath);
  }

  // Merge config sources together
  const config = merge({}, defaultConfig, appDefaultConfig, envConfig, options, rc, cli);

  config.rc = rcPath;

  // Resolve all paths
  for (const folder in config.folders) {
    if (config.folders.hasOwnProperty(folder)) {
      config.folders[folder] = path.resolve(config.folders[folder]);
    }
  }

  // Grab webpack config if we have it
  config.webpackConfig = this.getWebpack(envStr);

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
  try {
    file = path.resolve(file);

    // Read
    let rc = fs.readFileSync(file, {
      encoding: 'utf8',
    });

    // Convert to JS
    rc = JSON.parse(rc);

    return rc;
  } catch (accessError) {
    console.error(accessError.toString());
    return {};
  }
};

/**
 * Get the env
 * @param    {Object}    cli
 * @param    {Object}    config
 * @return   {String}
 */
Config.prototype.getEnv = function(cli, config) {
  return [cli.env, config.env, process.env.NODE_ENV, 'production'].find(function(item) {
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
  const fileName = `${this.configFolder}/${env}.js`;
  try {
    fs.accessSync(fileName);
  } catch (accessError) {
    // Can't find the file
    return {};
  }
  // Import
  let conf = require(fileName);

  // If its a function call it. We can use it to isolate scope if we want
  if (typeof conf === 'function') {
    conf = conf(this);
  }

  if (typeof conf === 'object') {
    return conf;
  }
  throw new TypeError(`${fileName} does not export an object or function that returns an object`);
};

/**
 * Grab the path to the machine config
 * @param    {Array<Object>}    configs
 * @return   {String}
 */
Config.prototype.getRCPath = function getRCPath(configs) {
  const config = configs.find(function(conf) {
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
  const files = [
    `${this.configFolder}/webpack.${env}.js`,
    `${this.configFolder}/webpack.default.js`,
    `${this.configFolder}/webpack.config.js`,
  ].map(function(file) {
    return path.resolve(file);
  });

  let index = files.length;
  while (--index > -1) {
    try {
      fs.accessSync(files[index]);
    } catch (accessError) {
      // If we can access it, skip it
      continue;
    }
    // throw new Error('wt')
    return require(files[index]);
  }
  return {};
};

module.exports = Config;
