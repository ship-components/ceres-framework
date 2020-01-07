/** *****************************************************************************
 * Setup Express Web Server
 ***************************************************************************** */

// Deps
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const session = require('express-session');
const fs = require('fs');

const routes = require('./routes');
const Benchmark = require('../lib/Benchmark');

module.exports = function Server(ceres) {
  // eslint-disable-line complexity
  const benchmarks = {};
  /** ***************************************************************************
   * Start Express
   */
  const app = express();

  /** ***************************************************************************
   * Template Globals
   */
  app.locals.config = ceres.config;
  app.set('port', ceres.config.port);

  /** ***************************************************************************
   * JSON
   */
  app.use(bodyParser.json());
  ceres.log.internal.silly('Global json body parser enabled');

  /** ***************************************************************************
   * Cookies
   */
  app.use(cookieParser(ceres.config.secret, ceres.config.cookie));
  ceres.log.internal.silly('Cookie parser enabled');

  /** ***************************************************************************
   * Obfuscate
   */
  app.disable('x-powered-by');
  ceres.log.internal.silly('Disabled x-powered-by header');

  /** ***************************************************************************
   * Response Time
   */
  if (ceres.config.responseTime) {
    // Adds the X-Response-Time header
    const responseTime = require('response-time');
    app.use(responseTime());
    ceres.log.internal.silly('Response time header configured');
  }

  /** ***************************************************************************
   * Session
   */
  if (ceres.config.session) {
    const RedisStore = require('connect-redis')(session);
    const sessionStore = session({
      store: new RedisStore(ceres.config.session.redis),
      secret: ceres.config.secret,
      resave: !!ceres.config.session.resave,
      saveUninitialized: !!ceres.config.session.saveUninitialized,
      rolling: !!ceres.config.session.rolling,
      name: ceres.config.name,
      cookie: ceres.config.cookie,
    });
    // Save it so sockets can use later
    app.set('sharedSession', sessionStore);
    // Apply
    app.use(sessionStore);
    ceres.log.internal.silly('Redis session store enabled');
  }

  /** ***************************************************************************
   * Proxies
   * @see https://expressjs.com/en/guide/behind-proxies.html
   */
  if (typeof ceres.config.trustProxy !== 'undefined') {
    app.set('trust proxy', ceres.config.trustProxy);
    ceres.log.internal.silly('trust proxy: %s', ceres.config.trustProxy);
  }

  /** ***************************************************************************
   * Views
   */
  app.set('view engine', ceres.config.viewEngine);
  app.set('views', ceres.config.folders.views);
  ceres.log.internal.silly('View engine setup: %s', ceres.config.viewEngine);

  if (ceres.config.viewCache) {
    app.enable('view cache');
    ceres.log.internal.silly('View cache enabled');
  } else {
    app.disable('view cache');
    ceres.log.internal.silly('View cache disabled');
  }

  /** ***************************************************************************
   * Compression
   */
  if (ceres.config.compression) {
    app.use(compression());
    ceres.log.internal.silly('Request compression enabled');
  }

  if (ceres.config.webpack && ceres.config.webpackConfig) {
    /** ***************************************************************************
     * Webpack middleware for dev. Needs to go before static assets to override them
     */
    const webpackDevMiddleware = require('../middleware/webpack')(ceres);
    app.use(webpackDevMiddleware);
    ceres.log.internal.silly('Webpack dev middleware configured');
  }

  if (ceres.config.folders.public) {
    /** ***************************************************************************
     * Static Assets
     */
    // Load before we start morgan so we don't log static assets, just requests
    app.use('/assets', express.static(ceres.config.folders.public));

    // Load assets into a versioned folder for caching. This is just an alias
    ceres.log.internal.info('Serving static assets from %s', ceres.config.folders.public);
  }

  /** ***************************************************************************
   * Logging
   */
  const logFilename = `${ceres.config.folders.logs}/access.log`;
  const accessLogStream = fs.createWriteStream(logFilename, { flags: 'a' });
  // Log to console
  app.use(
    morgan(ceres.config.logging.accessLogFormat, {
      stream: accessLogStream,
      skip: ceres.config.logging && ceres.config.logging.skip,
    })
  );
  ceres.log.internal.info(
    'Access (%s) logs writing to %s',
    ceres.config.logging.accessLogFormat,
    logFilename
  );

  /** ***************************************************************************
   * Throttle all requests
   */
  if (ceres.config.throttle) {
    const throttle = require('../middleware/throttled')(
      Object.assign(
        {
          logger: ceres.log.internal,
        },
        ceres.config.throttle
      )
    );
    app.use(throttle);
    ceres.log.internal.silly('Request throttling enabled');
  }

  /** ***************************************************************************
   * Routes
   */

  const props = ['controllers', 'routers'];
  props.forEach(prop => {
    if (!ceres.config.folders[prop] || !ceres.config[prop]) {
      return;
    }
    benchmarks[prop] = new Benchmark();
    const router = routes(ceres, prop);
    app.use(router);
    benchmarks[prop].stop();
    ceres.log.internal.info(
      '%s setup complete - %ss',
      prop,
      (benchmarks[prop].val() / 1000).toLocaleString(),
      { duration: benchmarks[prop].val() }
    );
  });

  /** ***************************************************************************
   * Error and Missing Resources
   */

  // Allow user to override not found response
  if (typeof ceres.config.middleware.notFound === 'function') {
    app.use(ceres.config.middleware.notFound);
    ceres.log.internal.silly('User supplied 404 middleware configured');
  } else {
    const notFound = require('../middleware/notFound')(ceres);
    app.use(notFound);
    ceres.log.internal.silly('Using default not found handler');
  }

  // Allow user to override error responses
  if (ceres.config.middleware.error) {
    if (ceres.config.middleware.error instanceof Array !== true) {
      ceres.config.middleware.error = [ceres.config.middleware.error];
    }
    ceres.config.middleware.error.forEach(middleware => {
      app.use(middleware);
    });
    ceres.log.internal.silly('User error middleware configured');
  } else {
    const errorMiddleware = require('../middleware/error')(ceres);
    app.use(errorMiddleware);
    ceres.log.internal.silly('Using default error handler');
  }

  return app;
};
