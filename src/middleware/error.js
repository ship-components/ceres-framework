var uuidv4 = require('uuid/v4');
var Youch = require('youch');

/**
 * Common errors and how to detect them
 * @type    {Array}
 */
var CommonErrors = [
  {
    message: /^Forbidden:?(.+)?/i,
    status: 401,
    level: 'warn',
    defaultText: 'Please login first'
  },
  {
    message: /^Permission\s?Denied:?(.+)?/i,
    status: 403,
    level: 'warn',
    defaultText: 'You do not have permission to access this.'
  },
  {
    message: /^Not\s?Found:?(.+)?/i,
    status: 404,
    level: 'warn',
    defaultText: 'Unable to find resource'
  },
  {
    message: /^Bad\s?Request:?(.+)?/i,
    status: 400,
    level: 'warn',
    defaultText: 'Bad Request'
  },
  {
    code: /^EBADCSRFTOKEN$/,
    status: 400,
    level: 'warn',
    defaultText: 'Bad Token'
  }
];

/**
 * Parse the error and see if its a common error. If it's common we'll probably
 * change the response status
 * @param    {Error}    err
 * @return   {Object}
 */
function findCommonError(err, Ceres) {
  // Attempt to match some common errors so we can apply the right status
  return CommonErrors.map(function(commonError){
    for (var key in commonError) {
      if (!commonError.hasOwnProperty(key)) {
        continue;
      } else if (err[key] && commonError[key] instanceof RegExp && commonError[key].test(err[key])) {
        // Attempt to grab some additional info from the commonError message
        var parts = err[key].match(commonError[key]);
        Ceres.log.silly('[ErrorHandler] Matched %s - error.message.%s like %s', commonError.defaultText, key, commonError[key].toString(), parts);
        return Object.assign({}, commonError, {
          message: parts[1] && parts[1].trim().length > 0 ? parts[1].trim() : commonError.defaultText,
          status: commonError.status
        });
      } else if (err[key] && commonError[key] === err[key] && ['level', 'defaultText'].indexOf(key) === -1) {
        Ceres.log.silly('[ErrorHandler] Matched %s - error.%s = %s', commonError.defaultText, key, err[key]);
        // Match other values like `code`
        return Object.assign({}, commonError, {
          message: commonError.defaultText,
          status: commonError.status
        });
      }
    }
    return;
  }).find(function(error){
    return typeof error === 'object';
  });
}

module.exports = function(Ceres) {
  return function(err, req, res, next){ // eslint-disable-line no-unused-vars, complexity
    // Generate a unique id we can use to track this error
    const errorId = uuidv4();

    /**
     * Default response
     * @type    {Object}
     */
    var response = {
      status: 500,
      name: err.name,
      message: err.message,
      error_id: errorId
    };

    // For development pass the stack along
    if (Ceres.config.debug && err instanceof Error) {
      response.stack = err.stack.split('\n');
    }

    // Attempt to match some common errors so we can apply the right status
    var commonErrorResponse = findCommonError(err, Ceres);
    if (commonErrorResponse) {
      ['status', 'message']
        .filter(function(key) {
          return typeof commonErrorResponse[key] !== 'undefined';
        })
        .forEach(function(key) {
          response[key] = commonErrorResponse[key];
        });
    }

    // Combine extra data to log
    var metadata = ['%s %s - %s', req.method, req.originalUrl, err.message, {
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
      stack: !commonErrorResponse || (commonErrorResponse && commonErrorResponse.level === 'error') ? err.stack : undefined
    }];

    // Make sure to log it
    if (commonErrorResponse && typeof Ceres.log[commonErrorResponse.level] === 'function') {
      // We set common errors to warnings to make them easier to filter later
      Ceres.log[commonErrorResponse.level].apply(Ceres.log, metadata);
    } else {
      Ceres.log.error.apply(Ceres.log, metadata);
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
    const acceptsJson = req.originalUrl.match(/^\/api/i) || (typeof req.headers.accept === 'string' && req.headers.accept.match(/application\/json/i));

    // RESPONSES
    if (Ceres.config.debug) {
      try {
        req.headers['x-error-id'] = errorId;
        // Youch generates pretty errors for us while in debug mode
        var youch = new Youch(err, req);

        youch[acceptsJson ? 'toJSON' : 'toHTML']()
          .then((prettyErrorResponse) => {
            if(acceptsJson) {
              res.send(Object.assign(response, {
                frames: prettyErrorResponse.error.frames
              })).end();
            } else {
              res.send(prettyErrorResponse).end();
            }
          });
      } catch (e) {
        Ceres.log.error(e);
        res.send(err.stack).end();
      }
      return null;
    } else if (acceptsJson) {
      // Json response if the client accepts it
      res.json(response).end();
    } else {
      var html = '<html>';
      html += '<head>';
      html += '<title>' + response.message + '</title>';
      html += '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.amber-blue.min.css" />';
      html += '</head>';
      html += '<body style="padding: 24px;">';
      html += '<h1>' + Ceres.config.name + '</h1>';
      html += '<h2>' + response.message + '</h2>';
      html += '<div>Error ID: ' + response.error_id + '</div>';
      if (Ceres.config.debug && response.stack) {
        html += '<pre>' + response.stack.join('\n') + '</pre>';
      }
      html += '</html>';
      res.send(html).end();
    }
  };
};
