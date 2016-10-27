/*******************************************************************************
 * Setup Express Web Server
 ******************************************************************************/

// Deps
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multer = require('multer');
var compression = require('compression');
var session = require('express-session');
var _ = require('lodash');
var mkdirp = require('mkdirp');

var routes = require('./routes');

module.exports = function(ceres) {
  /*****************************************************************************
   * Start Express
   */
  var app = express();
  ceres.log._ceres.silly('Configuring express server');

  /*****************************************************************************
   * Template Globals
   */
  app.locals.config = ceres.config;
  app.set('port', ceres.config.port);

  /*****************************************************************************
   * JSON
   */
  app.use(bodyParser.json());
  ceres.log._ceres.silly('Json body configured');

  /*****************************************************************************
   * Cookies
   */
  app.use(cookieParser());
  ceres.log._ceres.silly('Cookie parser configured');

  /*****************************************************************************
   * multipart/form-data - aka file uploads
   */
  if (ceres.config.folders.uploads) {
    // Make sure the folder exists
    mkdirp.sync(ceres.config.folders.uploads);
    var upload = multer({
      dest: ceres.config.folders.uploads
    });
    // Setup multer
    app.use(upload.any());
    ceres.log._ceres.silly('Multipart configured');
  }

  /*****************************************************************************
   * Obfusticate
   */
  app.disable('x-powered-by');
  ceres.log._ceres.silly('Disabled x-powered-by header');

  /*****************************************************************************
   * Response Time
   */
  if (ceres.config.env !== 'production') {
    // Adds the X-Response-Time header
    var responseTime = require('response-time');
    app.use(responseTime());
    ceres.log._ceres.silly('Response time header configured');
  }

  /*****************************************************************************
   * Session
   */
  var RedisStore = require('connect-redis')(session);
  var sessionStore = session({
    store: new RedisStore(ceres.config.session.redis),
    secret: ceres.config.secret,
    resave: true,
    saveUninitialized: true,
    name: ceres.config.name
  });
  // Save it so sockets can use later
  app.set('sharedSession', sessionStore);
  // Apply
  app.use(sessionStore);
  ceres.log._ceres.silly('Redis session store setup');

  /*****************************************************************************
   * Views
   */
  app.set('view engine', 'ejs');
  app.set('views', ceres.config.folders.views);
  ceres.log._ceres.silly('View engine setup: %s', 'ejs');

  if (ceres.config.env === 'production') {
    app.enable('view cache');
    ceres.log._ceres.silly('View cache enabled');
  } else {
    app.disable('view cache');
    ceres.log._ceres.silly('View cache disabled');
  }

  /*****************************************************************************
   * Compression
   */
  app.use(compression());
  ceres.log._ceres.silly('Request compression enabled');

  if (ceres.config.env !== 'production' && ceres.config.webpack && ceres.config.webpackConfig) {
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
    app.use('/assets/:version/', express.static(ceres.config.folders.public));
    ceres.log._ceres.silly('Public assets configured to read from %s', ceres.config.folders.public);
  }

  // Setup Uploads
  if (ceres.config.folders.uploads) {
    app.use('/uploads', express.static(ceres.config.folders.uploads));
    ceres.log._ceres.silly('Static uploads to be read from %s', ceres.config.folders.uploads);
  }

  /*****************************************************************************
   * Logging
   */
  if (ceres.config.env === 'production') {
    // Setup rotating logs
    var accessLogStream = require('file-stream-rotator').getStream({
      filename: ceres.config.folders.logs + '/access.log.%DATE%',
      frequency: 'daily',
      verbose: false,
      date_format: 'YYYY-MM-DD'
    });

    app.use(morgan('combined', {
      stream: accessLogStream
    }));

    ceres.log._ceres.silly('Access logs configured');
  } else {
    // Log to console
    app.use(morgan('dev'));
    ceres.log._ceres.silly('Access logs (dev) configured');
  }

  /*****************************************************************************
   * Throttle all requests
   */
  if (ceres.config.throttle) {
    var throttle = require('../middleware/throttled')(ceres.config.throttle);
    app.use(throttle);
    ceres.log._ceres.silly('Request throttling configured');
  }

  /*****************************************************************************
   * Routes
   */

  var props = ['controllers', 'routers'];
  props.forEach(function(prop){
    if (!ceres.config.folders[prop] || !ceres.config[prop]) {
      return;
    }
    var router = routes(ceres, prop);
    app.use(router);
  });


  /*****************************************************************************
   * Error and Missing Resources
   */

  // Allow user to override error responses
  if (ceres.config.middleware.error) {
    if(!_.isArray(ceres.config.middleware.error)) {
      ceres.config.middleware.error = [ceres.config.middleware.error];
    }
    ceres.config.middleware.error.forEach(function(middleware){
      app.use(middleware);
    });
    ceres.log._ceres.silly('User error middleware configued');
  } else {
    var errorMiddleware = require('../middleware/error')(ceres);
    app.use(errorMiddleware);
  }

  // Allow user to override not found response
  if(_.isFunction(ceres.config.middleware.notFound)) {
    app.use(ceres.config.middleware.notFound);
    ceres.log._ceres.silly('User supplied 404 middleware configured');
  } else {
    var notFound = require('../middleware/notFound')(ceres);
    app.use(notFound);
  }

  return app;
};
