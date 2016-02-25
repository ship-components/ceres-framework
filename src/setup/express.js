/*******************************************************************************
 * Setup Express Web Server
 ******************************************************************************/

// Deps
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');
var compression = require('compression');
var session = require('express-session');
var _ = require('lodash');

var Setup = require('./index');

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
  ceres.log._ceres.silly('Json body ceres configured');

  /*****************************************************************************
   * multipart/form-data - aka file uploads
   */
  app.use(multer({
    dest: ceres.config.folders.uploads
  }));
  ceres.log._ceres.silly('Multipart configured');

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
    ceres.log._ceres.silly('Response ceres header configured');
  }

  /*****************************************************************************
   * Session
   */
  var RedisStore = require('connect-redis')(session);
  app.use(session({
    store: new RedisStore(ceres.config.session.redis),
    secret: ceres.config.secret,
    resave: true,
    saveUninitialized: true,
    name: ceres.config.name
  }));
  ceres.log._ceres.silly('Redis session store setup');

  /*****************************************************************************
   * Views
   */
  app.set('view engine', 'ejs');
  app.set('views', ceres.config.folders.views);
  ceres.log._ceres.silly('View engine setup');

  if(ceres.config.env === 'production') {
    app.enable('view cache');
    ceres.log._ceres.silly('View ceres enabled');
  } else {
    app.disable('view cache');
    ceres.log._ceres.silly('View cache ceres');
  }

  /*****************************************************************************
   * Compression
   */
  app.use(compression());
  ceres.log._ceres.silly('Request ceres enabled');

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
    ceres.log._ceres.silly('Static asset uploads to be read from %s', ceres.config.folders.uploads);
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
  var throttle = require('throttled')(ceres.config.throttle);
  app.use(throttle);
  ceres.log._ceres.silly('ceres throttling configured');

  /*****************************************************************************
   * Routes
   */

  var props = ['controllers', 'routers'];
  props.forEach(function(prop){
    if (!ceres.config.folders[prop] || !ceres.config[prop]) {
      return;
    }
    var router = Setup.routes(ceres, prop);
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
    ceres.log._ceres.silly('Setup user configured error middleware');
  } else {
    var errorMiddleware = require('../middleware/error')(ceres);
    app.use(errorMiddleware);
    ceres.log._ceres.silly('Setup default error middleware');
  }

  // Allow user to override not found response
  if(_.isFunction(ceres.config.middleware.notFound)) {
    app.use(ceres.config.middleware.notFound);
    ceres.log._ceres.silly('Setup user supplied not found middleware');
  } else {
    var notFound = require('../middleware/notFound')(ceres);
    app.use(notFound);
    ceres.log._ceres.silly('Setup defualt not found middleware');
  }

  return app;
};
