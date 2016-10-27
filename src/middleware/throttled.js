/*******************************************************************************
 * throttle
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Throttle middleware to prevent brute force attacks
 * @flow
 ******************************************************************************/

// Modules
var redis = require('redis');
var async = require('async');
var moment = require('moment');

/**
 * Redis Client
 *
 * @type    {Redis}
 */
var client = redis.createClient();

/**
 * Defaults
 *
 * @type    {Object}
 */
var defaults = {
  prefix: 'throttle:',
  limit: 1000,
  period: 60 * 15,
  ban: 15 * 60,
  logger: console,
  headers: true
};

/**
 * Merge multiple obects together
 *
 * @param     {Object...}
 * @return    {Object}
 */
function assign() {
  var result = {};
  var args = Array.prototype.slice.call(arguments);
  for(var i = 0; i < args.length; i++) {
    var obj = args[i];
    if(typeof obj !== 'object') {
      continue;
    }
    for(var key in obj) {
      if(obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    }
    obj = void 0;
  }
  return result;
}

/**
 * Throttle middleware to prevent abuse
 *
 * @param     {Object}    options
 * @return    {Express.middleware}
 * @example   router.get('/route', throttle(), function(req, res){});
 */
module.exports = function(options) {
  // Apply defaults
  options = assign(defaults, options);

  var logger = options.logger;

  /**
   * Middleware
   *
   * @param     {Express.req}      req
   * @param     {Express.res}      res
   * @param     {Function}         next
   */
  return function(req, res, next) {
    // Get IP from proxy
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Key to store in redis
    var key = options.prefix + ip;

    // Run async redis requests
    async.auto({
        /**
         * See if a micro session exists
         *
         * @param     {Function}    done
         */
        req: function(done) {
          client.hgetall(key, done);
        },

        /**
         * Get the count of request for this period
         *
         * @type    {Array}
         */
        count: ['req',
          function(results, done) {
            var count = (results.req ? parseInt(results.req.count, 10) : 0) + 1;
            client.hset([key, 'count', count], function(err) {
              if (err) {
                done(err);
              } else {
                done(null, count);
              }
            });
          }
        ],

        /**
         * Detemine if we're throttled or not
         *
         * @type    {Array}
         */
        throttled: ['count',
          function(results, done) {
            var throttled = results.count > options.limit;

            if (results.req && (results.req.throttled === 'true') === throttled) {
              done(null, throttled);
              return;
            }
            client.hset([key, 'throttled', throttled], function(err) {
              if (err) {
                done(err);
              } else {
                done(null, throttled);
              }
            });
          }
        ],

        /**
         * Set the key to expire in redis
         *
         * @type    {Array}
         */
        expire: ['req', 'throttled',
          function(results, done) {
            if (!results.req) {
              client.expire(key, options.period, done);
            }
            if (results.throttled && !results.req.expiresAt) {
              client.expire(key, options.ban, done);
            } else {
              done();
            }
          }
        ],

        /**
         * Save when the the ban will be lifted
         *
         * @type    {Array}
         */
        expiresAt: ['req', 'throttled',
          function(results, done) {
            if (results.throttled && results.req && !results.req.expiresAt) {
              var expiresAt = Date.now() + (options.ban * 1000);
              client.hset(key, 'expiresAt', expiresAt, function(err) {
                if (err) {
                  done(err);
                } else {
                  done(null, expiresAt);
                }
              });
            } else if (results.req && results.req.expiresAt) {
              done(null, parseInt(results.req.expiresAt, 10));
            } else {
              done();
            }
          }
        ]
      },
      /**
       * Now do something with all of this information
       *
       * @param     {Error}    err
       * @param     {Object}    results
       */
      function(err, results) {

        if(options.headers) {
          // Set some headers so we can track what's going on
          var headers = {
            'X-Throttled': results.throttled,
            'X-Throttle-Remaining': Math.max(options.limit - results.count, 0)
          };
          if (results.expiresAt) {
            headers['X-Throttle-Reset'] = results.expiresAt;
          }
          res.set(headers);
        }

        if (err) {
          // Unknown error
          next(err);
          return;
        } else if (results.throttled) {

          if(logger) {
            // Log it
            logger.warn(
              '%s - ResponseThrottled for %s seconds - %s requests exceeded %s within %s seconds',
              ip,
              options.ban,
              results.count,
              options.limit,
              options.period);
          }

          // Let the client know this is forbidden
          res.status(403);

          // Create a human readable error
          var banLength = moment.duration(options.ban, 'seconds').humanize();
          next('Warning: Too many requests. You have been throttled for ' + banLength + '. ' +
            'Try again ' + moment(results.expiresAt).fromNow());
          return;
        } else {
          // All is good
          next();
          return;
        }
      });
  };
};
