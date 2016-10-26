/** ****************************************************************************
 * Default App Configuration
 ******************************************************************************/

var fs = require('fs');
var path = require('path');

var pkg = require(process.cwd() + '/package.json');

/**
 * Application settings. rc file overrides this file and should be used to store
 * sensitive information such as secrets and passwords
 *
 * @type    {Object}
 */
var config = {
  /**
   * Name of app
   *
   * @type    {String}
   */
  name: pkg.name,

  /**
   * Version
   *
   * @type    {String}
   */
  version: pkg.version,

  /**
   * Default port
   *
   * @type    {Number}
   */
  port: 3000,

  /**
   * Location of the rc files
   *
   * @type    {String}
   */
  rc: '.configrc',

  /**
   * What mode to run in
   *
   * @type    {String}
   */
  env: process.env.NODE_ENV,

  /**
   * How many worker instances to run at one time
   *
   * @type    {Number}
   */
  instances: require('os').cpus().length,

  /**
   * Where is the stuff?
   *
   * @type    {Object}
   */
  folders: {
    logs: './logs',
    public: './.tmp',
    uploads: './storage/uploads',
    controllers: './server/controllers',
    views: './server/views',
    middleware: './server/middleware'
  },

  /**
   * Override in rc for production
   *
   * @type    {Object}
   */
  db: {
    type     : 'bookshelf',
    host     : '127.0.0.1',
    user     : 'ceres',
    password : 'ceres',
    database : 'ceres',
    charset  : 'utf8'
  },

  /**
   * Throttle requests
   *
   * @type    {Object}
   */
  throttle: {
    limit: 1000, // per
    period: 15 * 60, // seconds
    ban: 15 * 60 // seconds
  },

  /**
   * Session configuration
   *
   * @type    {Object}
   */
  session: {
    ttl: 3600,

    /**
     * Settings for Redis Session Store
     *
     * @type    {Object}
     */
    redis: {
      host: '127.0.0.1',
      port: 6379,
      ttl: 3600,
      pass: '',
      db: 0,
      prefix: 'os'
    }
  },

  /**
   * Render settings
   *
   * @type    {Object}
   */
  render: {
    /**
     * HTML Template
     *
     * @type    {String}
     */
    template: path.resolve(process.cwd() + '/server/views/index.ejs'),

    /**
     * Where the checksums are cached
     *
     * @type    {String}
     */
    checksumrc: path.resolve(process.cwd() + '/.checksumrc'),

    /**
     * Minify the HTML?
     *
     * @type    {Boolean}
     */
    minifyHtml: true
  },

  /**
   * A list of controllers and where to connect their routers. This is a high
   * overview of routing
   *
   * @type    {Object}
   */
  controllers: {}
};

module.exports = config;
