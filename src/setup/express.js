/*******************************************************************************
 * Setup Express Web Server
 ******************************************************************************/

// Deps
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var session = require('express-session');
var fs = require('fs');

var routes = require('./routes');
var Benchmark = require('../lib/Benchmark');

module.exports = function Server(ceres) { // eslint-disable-line complexity
  let benchmarks = {};
  /*****************************************************************************
   * Start Express
   */
  var app = express();

  /*****************************************************************************
   * Template Globals
   */
  app.locals.config = ceres.config;
  app.set('port', ceres.config.port);

  /*****************************************************************************
   * JSON
   */
  app.use(bodyParser.json());
  ceres.log._ceres.silly('Global json body parser enabled');

  /*****************************************************************************
   * Cookies
   */
  app.use(cookieParser(ceres.config.secret, ceres.config.cookie));
  ceres.log._ceres.silly('Cookie parser enabled');

  /*****************************************************************************
   * Obfusticate
   */
  app.disable('x-powered-by');
  ceres.log._ceres.silly('Disabled x-powered-by header');

  /*****************************************************************************
   * Response Time
   */
  if (ceres.config.responseTime) {
    // Adds the X-Response-Time header
    var responseTime = require('response-time');
    app.use(responseTime());
    ceres.log._ceres.silly('Response time header configured');
  }

  /*****************************************************************************
   * Session
   */
  if (ceres.config.session) {
    var RedisStore = require('connect-redis')(session);
    var sessionStore = session({
      store: new RedisStore(ceres.config.session.redis),
      secret: ceres.config.secret,
      resave: !!ceres.config.session.resave,
      saveUninitialized: !!ceres.config.session.saveUninitialized,
      rolling: !!ceres.config.session.rolling,
      name: ceres.config.name,
      cookie: ceres.config.cookie
    });
    // Save it so sockets can use later
    app.set('sharedSession', sessionStore);
    // Apply
    app.use(sessionStore);
    ceres.log._ceres.silly('Redis session store enabled');
  }

  /*****************************************************************************
   * Proxies
   * @see https://expressjs.com/en/guide/behind-proxies.html
   */
  if (typeof ceres.config.trustProxy !== 'undefined') {
    app.set('trust proxy', ceres.config.trustProxy);
    ceres.log._ceres.silly('trust proxy: %s', ceres.config.trustProxy);
  }

  /*****************************************************************************
   * Views
   */
  app.set('view engine', ceres.config.viewEngine);
  app.set('views', ceres.config.folders.views);
  ceres.log._ceres.silly('View engine setup: %s', ceres.config.viewEngine);

  if (ceres.config.viewCache) {
    app.enable('view cache');
    ceres.log._ceres.silly('View cache enabled');
  } else {
    app.disable('view cache');
    ceres.log._ceres.silly('View cache disabled');
  }

  /*****************************************************************************
   * Compression
   */
  if (ceres.config.compression) {
    app.use(compression());
    ceres.log._ceres.silly('Request compression enabled');
  }

  if (ceres.config.webpack && ceres.config.webpackConfig) {
    /*****************************************************************************
     * Webpack middleware for dev. Needs to go before static assets to override them
     */
    var webpackDevMiddleware = require('../middleware/webpack')(ceres);
    app.use(webpackDevMiddleware);
    ceres.log._ceres.silly('Webpack dev middleware configured');
  }

  if (ceres.config.folders.public) {
    /*****************************************************************************
     * Static Assets
     */
    // Load before we start morgan so we don't log static assets, just requests
    app.use('/assets', express.static(ceres.config.folders.public));

    // Load assets into a versioned folder for caching. This is just an alias
    ceres.log._ceres.info('Serving static assets from %s', ceres.config.folders.public);
  }

  /*****************************************************************************
   * Logging
   */
  var logFilename = ceres.config.folders.logs + '/access.log';
  var accessLogStream = fs.createWriteStream(logFilename, {flags: 'a'});
  // Log to console
  app.use(morgan(ceres.config.logging.accessLogFormat, {
    stream: accessLogStream,
    skip: ceres.config.logging && ceres.config.logging.skip
  }));
  ceres.log._ceres.info('Access (%s) logs writing to %s', ceres.config.logging.accessLogFormat, logFilename);

  /*****************************************************************************
   * Throttle all requests
   */
  if (ceres.config.throttle) {
    var throttle = require('../middleware/throttled')(Object.assign({
      logger: ceres.log._ceres
    }, ceres.config.throttle));
    app.use(throttle);
    ceres.log._ceres.silly('Request throttling enabled');
  }

  /*****************************************************************************
   * Routes
   */

  var props = ['controllers', 'routers'];
  props.forEach(function(prop){
    if (!ceres.config.folders[prop] || !ceres.config[prop]) {
      return;
    }
    benchmarks[prop] = new Benchmark();
    var router = routes(ceres, prop);
    app.use(router);
    benchmarks[prop].stop();
    ceres.log._ceres.info('%s setup complete - %ss', prop, (benchmarks[prop].val() / 1000).toLocaleString(), { duration: benchmarks[prop].val() });
  });


  /*****************************************************************************
   * Error and Missing Resources
   */

  // Allow user to override not found response
  if (typeof ceres.config.middleware.notFound === 'function') {
    app.use(ceres.config.middleware.notFound);
    ceres.log._ceres.silly('User supplied 404 middleware configured');
  } else {
    var notFound = require('../middleware/notFound')(ceres);
    app.use(notFound);
    ceres.log._ceres.silly('Using default not found handler');
  }

  // Allow user to override error responses
  if (ceres.config.middleware.error) {
    if (ceres.config.middleware.error instanceof Array !== true) {
      ceres.config.middleware.error = [ceres.config.middleware.error];
    }
    ceres.config.middleware.error.forEach(function(middleware){
      app.use(middleware);
    });
    ceres.log._ceres.silly('User error middleware configued');
  } else {
    var errorMiddleware = require('../middleware/error')(ceres);
    app.use(errorMiddleware);
    ceres.log._ceres.silly('Using default error handler');
  }

  return app;
};
