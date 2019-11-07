const uuidv4 = require('uuid/v4');
const Youch = require('youch');
const { findCommonError } = require('../lib/findCommonError');

module.exports = function error(Ceres) {
  // eslint-disable-next-line no-unused-vars, complexity
  return (err, req, res, next) => {
    // Generate a unique id we can use to track this error
    const errorId = uuidv4();

    /**
     * Default response
     * @type    {Object}
     */
    const response = {
      status: 500,
      name: err.name,
      message: err.message,
      error_id: errorId,
    };

    // For development pass the stack along
    if (Ceres.config.debug && err instanceof Error) {
      response.stack = err.stack.split('\n');
    }

    // Attempt to match some common errors so we can apply the right status
    const commonErrorResponse = findCommonError(err, Ceres.logger('error'));
    if (commonErrorResponse) {
      ['status', 'message']
        .filter(key => {
          return typeof commonErrorResponse[key] !== 'undefined';
        })
        .forEach(key => {
          response[key] = commonErrorResponse[key];
        });
    }

    // Combine extra data to log
    const metadata = [
      '%s %s - %s',
      req.method,
      req.originalUrl,
      err.message,
      {
        statusCode: response.status,
        http_verb: req.method,
        http_request: req.originalUrl,
        protocol: req.protocol,
        host: req.get('host'),
        method: req.method,
        clientip: req.ip,
        username: req.user && req.user.username,
        referrer: req.headers.referrer,
        useragent: req.headers['user-agent'],
        error_id: errorId,
        stack:
          !commonErrorResponse || (commonErrorResponse && commonErrorResponse.level === 'error')
            ? err.stack
            : undefined,
      },
    ];

    // Make sure to log it
    if (commonErrorResponse && typeof Ceres.log[commonErrorResponse.level] === 'function') {
      // We set common errors to warnings to make them easier to filter later
      Ceres.log[commonErrorResponse.level](...metadata);
    } else {
      Ceres.log.error(...metadata);
    }

    // Headers already sent so we can't end anything else
    if (res.headersSent) {
      return;
    }

    // Save it in the headers so we always can get to it
    res.set('X-Error-Id', errorId);

    // Set the http status
    res.status(response.status || 500);

    // Determine if we should return in json
    const acceptsJson =
      req.originalUrl.match(/^\/api/i) ||
      (typeof req.headers.accept === 'string' && req.headers.accept.match(/application\/json/i));

    // RESPONSES
    if (Ceres.config.debug) {
      try {
        req.headers['x-error-id'] = errorId;
        // Youch generates pretty errors for us while in debug mode
        const youch = new Youch(err, req);

        youch[acceptsJson ? 'toJSON' : 'toHTML']().then(prettyErrorResponse => {
          if (acceptsJson) {
            res
              .send(
                Object.assign(response, {
                  frames: prettyErrorResponse.error.frames,
                })
              )
              .end();
          } else {
            res.send(prettyErrorResponse).end();
          }
        });
      } catch (e) {
        Ceres.log.error(e);
        res.send(err.stack).end();
      }
      return;
    }
    if (acceptsJson) {
      // Json response if the client accepts it
      res.json(response).end();
    } else {
      let html = '<html>';
      html += '<head>';
      html += `<title>${response.message}</title>`;
      html +=
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.amber-blue.min.css" />';
      html += '</head>';
      html += '<body style="padding: 24px;">';
      html += `<h1>${Ceres.config.name}</h1>`;
      html += `<h2>${response.message}</h2>`;
      html += `<div>Error ID: ${response.error_id}</div>`;
      if (Ceres.config.debug && response.stack) {
        html += `<pre>${response.stack.join('\n')}</pre>`;
      }
      html += '</html>';
      res.send(html).end();
    }
  };
};
