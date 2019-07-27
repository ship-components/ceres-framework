/** ****************************************************************************
 * Default App Configuration
 ***************************************************************************** */

const path = require('path');

const pkg = require(`${process.cwd()}/package.json`);

/**
 * Application settings. rc file overrides this file and should be used to store
 * sensitive information such as secrets and passwords
 * @namespace {object} Config.Config
 * @memberof Ceres
 */
const config = {
  /**
   * Name of app
   * @memberof Config.Config
   * @type {string}
   */
  name: pkg.name,

  /**
   * Application secret used to encrypt sessions
   * @memberof Config.Config
   * @type {string}
   */
  secret: undefined,

  /**
   * Version
   * @memberof Config.Config
   * @type {string}
   */
  version: pkg.version,

  /**
   * Default port
   * @memberof Config.Config
   * @type {number}
   */
  port: 3000,

  /**
   * Machine specific configuration. The app secret is store in this file.
   * This is typically created with the init command
   * @memberof Config.Config
   * @type {string}
   */
  rc: `.${pkg.name}rc`,

  /**
   * Path to pid location
   * @memberof Config.Config
   * @type {string}
   */
  pid: 'ceres.pid',

  /**
   * Either cluster or fork. Determines how multiple instances of the app
   * are run to take advantage of multiple cores. fork is recommended when
   * being a reverse proxy
   * @memberof Config.Config
   * @type {string}
   */
  processManagement: 'cluster',

  /**
   * What mode to run in
   * @memberof Config.Config
   * @type {string}
   */
  env: 'production',

  /**
   * Turn on debugging
   * @memberof Config.Config
   * @type  {boolean}
   */
  debug: false,

  /**
   * Cache html
   * @memberof Config.Config
   * @type  {boolean}
   */
  viewCache: true,

  /**
   * View engine to use for express
   * @memberof Config.Config
   * @type {string}
   */
  viewEngine: 'ejs',

  /**
   * How many worker instances to run at one time
   * @memberof Config.Config
   * @type {number}
   */
  instances: require('os').cpus().length,

  /**
   * Turn on request compression
   * @memberof Config.Config
   * @type  {boolean}
   */
  compression: true,

  /**
   * Logging options
   * @memberof Config.Config
   * @type    {Object}
   * @namespace Config.Config.Logging
   */
  logging: {
    /**
     * What log format to use for access logs. Typically dev or combined
     * @memberof Ceres.Config.Logging
     * @type {string}
     */
    accessLogFormat: 'combined',

    /**
     * Include json logs
     * @memberof Ceres.Config.Logging
     * @type  {boolean}
     */
    json: true,

    /**
     * Include human readable logs
     * @memberof Ceres.Config.Logging
     * @type  {boolean}
     */
    human: true,
  },

  /**
   * Where is the stuff?
   * @memberof Config.Config
   * @type    {Object}
   */
  folders: {
    logs: './logs',
    public: './.tmp',
    uploads: './storage/uploads',
    controllers: './server/controllers',
    views: './server/views',
    middleware: './server/middleware',
  },

  /**
   * Databse Configuration
   * @memberof Ceres.Config
   * @namespace Ceres.Config.db
   */
  db: {
    /**
     * Database Type
     * @type {string}
     * @memberof Ceres.Config.db
     */
    type: 'none',
    /**
     * Database Host
     * @type {string}
     * @memberof Ceres.Config.db
     */
    host: '127.0.0.1',
    /**
     * Database Username
     * @type {string}
     * @memberof Ceres.Config.db
     */
    user: '',
    /**
     * Database Password
     * @type {string}
     * @memberof Ceres.Config.db
     */
    password: '',
    /**
     * Database Name
     * @type {string}
     * @memberof Ceres.Config.db
     */
    database: '',
    /**
     * Database Charset
     * @type {string}
     * @memberof Ceres.Config.db
     */
    charset: 'utf8',
  },

  /**
   * Throttle requests
   * @memberof Config.Config
   * @type    {object | boolean}
   */
  throttle: false,

  /**
   * Session configuration
   * @memberof Config.Config
   * @see https://github.com/expressjs/session
   * @namespace {object} Ceres.Config.Session
   */
  session: {
    /**
     * Session length
     * @memberof Ceres.Config.Session
     * @type {number}
     */
    ttl: 3600,

    /**
     * Forces the session to be saved back to the session store, even if the
     * session was never modified during the request.
     * @memberof Ceres.Config.Session
     * @type  {boolean}
     */
    resave: false,

    /**
     * Forces a session that is "uninitialized" to be saved to the store. A
     * session is uninitialized when it is new but not modified.
     * @memberof Ceres.Config.Session
     * @type  {boolean}
     */
    saveUninitialized: false,

    /**
     * Force a session identifier cookie to be set on every response. The
     * expiration is reset to the original maxAge, resetting the expiration
     * countdown.
     * @memberof Ceres.Config.Session
     * @type {boolean}
     */
    rolling: true,

    /**
     * Settings for Redis Session Store
     * @memberof Ceres.Config.Session
     * @type {Object}
     */
    redis: {
      host: '127.0.0.1',
      port: 6379,
      ttl: 3600,
      pass: '',
      db: 0,
      prefix: 'os',
    },
  },

  /**
   * Settings for Redis Session Store
   * @memberof Config.Config
   * @type    {Object}
   */
  cache: {
    type: 'redis',
    host: '127.0.0.1',
    port: 6379,
    ttl: 3600,
    pass: '',
    db: 0,
    prefix: 'os',
  },

  /**
   * Render settings
   * @memberof Config.Config
   * @type    {Object}
   */
  render: {
    /**
     * HTML Template
     *
     * @type {string}
     */
    template: path.resolve(`${process.cwd()}/server/views/index.ejs`),

    /**
     * Where the checksums are cached
     *
     * @type {string}
     */
    checksumrc: path.resolve(`${process.cwd()}/.checksumrc`),

    /**
     * Minify the HTML?
     *
     * @type  {boolean}
     */
    minifyHtml: true,
  },

  /**
   * Configure Hash Ids
   * @memberof Config.Config
   * @type    {Object}
   */
  hashIds: {
    /**
     * Change the secret and hence generated keys, probably will be the same
     * from preprod to production to make it easie to copy data
     * @memberof Config.Config
     * @type {string}
     */
    secret: 'ceres',

    /**
     * Min lengh of hashes. They may be longer.
     * @memberof Config.Config
     * @type {number}
     */
    minLength: 5,
  },

  /**
   * A list of controllers and where to connect their routers. This is a high
   * overview of routing
   * @memberof Config.Config
   * @type    {Object}
   */
  controllers: {},
};

module.exports = config;
