/** ****************************************************************************
 * Default App Configuration
 ******************************************************************************/

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
   * Machine specific configuration. The app secret is store in this file.
   * This is typically created with the init command
   *
   * @type    {String}
   */
  rc: '.' + pkg.name + 'rc',

  /**
   * Path to pid location
   * @type {String}
   */
  pid: 'ceres.pid',

	/**
	 * Either cluster or fork. Determines how multiple instances of the app
	 * are run to take advantage of multiple cores. fork is recommended when
	 * being a reverse proxy
	 * @type    {String}
	 */
	processManagement: 'cluster',

  /**
   * What mode to run in
   *
   * @type    {String}
   */
  env: 'production',

  /**
   * How many worker instances to run at one time
   *
   * @type    {Number}
   */
  instances: require('os').cpus().length,

  /**
   * Turn on request compression
   * @type    {Boolean}
   */
  compression: true,

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
    type     : 'none',
    host     : '127.0.0.1',
    user     : '',
    password : '',
    database : '',
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
    /**
     * Session length
     * @type {Number}
     */
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
   * Settings for Redis Session Store
   *
   * @type    {Object}
   */
  cache: {
    type: 'redis',
    host: '127.0.0.1',
    port: 6379,
    ttl: 3600,
    pass: '',
    db: 0,
    prefix: 'os'
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
   * Configure Hash Ids
   * @type    {Object}
   */
  hashIds: {
    /**
     * Change the secret and hence generated keys, probably will be the same
     * from preprod to production to make it easie to copy data
     * @type    {String}
     */
    secret: 'ceres',

    /**
     * Min lengh of hashes. They may be longer.
     * @type    {Number}
     */
    minLength: 5
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
