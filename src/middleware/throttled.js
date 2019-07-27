// Modules
const redis = require('redis');
const async = require('async');
const moment = require('moment');

/**
 * Defaults
 *
 * @type    {Object}
 */
const defaults = {
  prefix: 'throttle:',
  limit: 1000,
  period: 60 * 15,
  ban: 15 * 60,
  logger: console,
  headers: true,
};

/**
 * Merge multiple obects together
 *
 * @param     {Object[]} args
 * @return    {Object}
 */
function assign(...args) {
  const result = {};
  for (let i = 0; i < args.length; i += 1) {
    let obj = args[i];
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        result[key] = obj[key];
      });
    }
    obj = undefined;
  }
  return result;
}

/**
 * Throttle middleware to prevent abuse
 *
 * @param     {Object}    options
 * @return    {import('express').Handler}
 * @example   router.get('/route', throttle(), function(req, res){});
 */
module.exports = options => {
  // Apply defaults
  options = assign(defaults, options);

  const { logger } = options;

  /**
   * Redis Client
   *
   * @type    {import('redis').RedisClient}
   */
  const client = redis.createClient(
    Object.assign(
      {
        host: '127.0.0.1',
        port: 6379,
        ttl: 3600,
        pass: '',
        db: 0,
        prefix: options.prefix,
      },
      options.redis
    )
  );

  /**
   * Middleware
   *
   * @param     {Express.req}      req
   * @param     {Express.res}      res
   * @param     {Function}         next
   */
  return (req, res, next) => {
    // Get IP from proxy
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Key to store in redis
    const key = options.prefix + ip;

    // Run async redis requests
    async.auto(
      {
        /**
         * See if a micro session exists
         *
         * @param {import('redis').Callback<object>} done
         */
        req(done) {
          client.hgetall(key, done);
        },

        /**
         * Get the count of request for this period
         */
        count: [
          'req',
          (done, results) => {
            const count = (results.req ? parseInt(results.req.count, 10) : 0) + 1;
            client.hset([key, 'count', count], err => {
              if (err) {
                done(err);
              } else {
                done(null, count);
              }
            });
          },
        ],

        /**
         * Detemine if we're throttled or not
         *
         * @type    {Array}
         */
        throttled: [
          'count',
          (done, results) => {
            const throttled = results.count > options.limit;

            if (results.req && (results.req.throttled === 'true') === throttled) {
              done(null, throttled);
              return;
            }
            client.hset([key, 'throttled', throttled], err => {
              if (err) {
                done(err);
              } else {
                done(null, throttled);
              }
            });
          },
        ],

        /**
         * Set the key to expire in redis
         *
         * @type    {Array}
         */
        expire: [
          'req',
          'throttled',
          (done, results) => {
            if (!results.req) {
              client.expire(key, options.period, done);
            }
            if (results.throttled && !results.req.expiresAt) {
              client.expire(key, options.ban, done);
            } else {
              done();
            }
          },
        ],

        /**
         * Save when the the ban will be lifted
         *
         * @type    {Array}
         */
        expiresAt: [
          'req',
          'throttled',
          (done, results) => {
            if (results.throttled && results.req && !results.req.expiresAt) {
              const expiresAt = Date.now() + options.ban * 1000;
              client.hset(key, 'expiresAt', expiresAt, err => {
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
          },
        ],
      },
      /**
       * Now do something with all of this information
       *
       * @param     {Error}    err
       * @param     {Object}    results
       */
      (err, results) => {
        if (options.headers) {
          // Set some headers so we can track what's going on
          const headers = {
            'X-Throttled': results.throttled,
            'X-Throttle-Remaining': Math.max(options.limit - results.count, 0),
          };
          if (results.expiresAt) {
            headers['X-Throttle-Reset'] = results.expiresAt;
          }
          res.set(headers);
        }

        if (err) {
          // Unknown error
          next(err);
        } else if (results.throttled) {
          if (logger) {
            // Log it
            logger.warn(
              '%s - ResponseThrottled for %s seconds - %s requests exceeded %s within %s seconds',
              ip,
              options.ban,
              results.count,
              options.limit,
              options.period
            );
          }

          // Let the client know this is forbidden
          res.status(403);

          // Create a human readable error
          const banLength = moment.duration(options.ban, 'seconds').humanize();
          next(
            `Warning: Too many requests. You have been throttled for ${banLength}. ` +
              `Try again ${moment(results.expiresAt).fromNow()}`
          );
        } else {
          // All is good
          next();
        }
      }
    );
  };
};
