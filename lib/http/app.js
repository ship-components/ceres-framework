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

var Setup = require('../setup');

module.exports = function(config) {
  /*****************************************************************************
   * Start Express
   */
  var app = express();

  /*****************************************************************************
   * Template Globals
   */
  app.locals.config = config;

  /*****************************************************************************
   * JSON
   */
  app.use(bodyParser.json());

  /*****************************************************************************
   * multipart/form-data - aka file uploads
   */
  app.use(multer({
    dest: config.folders.uploads
  }));

  /*****************************************************************************
   * Obfusticate
   */
  app.disable('x-powered-by');

  /*****************************************************************************
   * Response Time
   */
  if (config.env !== 'production') {
    // Adds the X-Response-Time header
    var responseTime = require('response-time');
    app.use(responseTime());
  }

  /*****************************************************************************
   * Session
   */
  var RedisStore = require('connect-redis')(session);
  app.use(session({
    store: new RedisStore(config.session.redis),
    secret: config.secret,
    resave: true,
    saveUninitialized: true,
    name: config.name
  }));

  /*****************************************************************************
   * Views
   */
  app.set('view engine', 'ejs');
  app.set('views', config.folders.views);
  if (config.env === 'production') {
    app.enable('view cache');
  } else {
    app.disable('view cache');
  }

  /*****************************************************************************
   * Compression
   */
  app.use(compression());

  /*****************************************************************************
   * DB
   */
  var db = require('../db.js')(config);
  app.set('db', db);

  /*****************************************************************************
   * Static Assets
   */
  // Load before we start morgan so we don't log static assets, just requests
  app.use('/assets', express.static(config.folders.public));
  // Load assets into a versioned folder for caching. This is just an alias
  app.use('/assets/:version/', express.static(config.folders.public));
  // Setup Uploads
  app.use('/uploads', express.static(config.folders.uploads));

  /*****************************************************************************
   * Logging
   */
  if (config.env === 'production') {
    // Setup rotating logs
    var accessLogStream = require('file-stream-rotator').getStream({
      filename: config.folders.logs + '/access.log.%DATE%',
      frequency: 'daily',
      verbose: false,
      date_format: 'YYYY-MM-DD'
    });

    app.use(morgan('combined', {
      stream: accessLogStream
    }));
  } else {
    // Log to console
    app.use(morgan('dev'));
  }

  /*****************************************************************************
   * Throttle all requests
   */
  var throttle = require('throttled')(config.throttle);
  app.use(throttle);

  /*****************************************************************************
   * Routes
   */

  var props = ['controllers', 'routers'];
  props.forEach(function(prop){
    if(!config.folders[prop] || !config[prop]) {
      return;
    }
    var router = Setup.routes({
      folder: config.folders[prop],
      routers: config[prop]
    });
    app.use(router);
  });

  // Allow user to override error responses
  if(this.middleware.error) {
    if(!_.isArray(this.middleware.error)) {
      this.middleware.error = [this.middleware.error];
    }
    this.middleware.error.forEach(function(middleware){
      app.use(middleware);
    });
  } else {
    app.use(function(err, req, res, next){
      console.log(err);
      if(config.env === 'production') {
        res.status(500).send('Internal Server Error').end();
      } else {
        res.status(500).send(err).end();
      }
    });
  }

  // Allow user to override not found response
  if(_.isFunction(this.middleware.notFound)) {
    app.use(this.middleware.notFound);
  } else {
    app.use(function(req, res, next){
      res.status(404).send('Unable to find resrouce').end();
    });
  }

  return app;
};
