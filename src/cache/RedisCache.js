const redis = require('redis');
const Promise = require('bluebird');

/**
 * Setup cache instance
 * @param    {Objet}    options
 */
function RedisCache(options, logger) {
  this.options = Object.assign(
    {
      host: '127.0.0.1',
      port: 6379,
      ttl: 3600,
      pass: '',
      db: 0,
      prefix: 'ceres',
    },
    options
  );

  /**
   * Save logger
   * @type    {Winston}
   */
  this.logger = logger;

  /**
   * Setup client
   */
  this.client = redis.createClient(this.options);

  /**
   * Log any errors
   */
  this.client.on('error', function(err) {
    if (this.logger) {
      this.logger.error(err);
    } else {
      console.error(err);
    }
  });

  /**
   * Make client emitter available on parent
   * @type    {Function}
   */
  this.on = this.client.on.bind(this.client);

  if (this.logger) {
    this.logger.silly('Setup redis cache');
  }
}

/**
 * Get a key
 */
RedisCache.prototype.get = function get(key) {
  if (typeof key !== 'string') {
    return Promise.reject(new TypeError('key is not a string'));
  }
  if (this.logger) {
    this.logger.silly('Getting %s', key);
  }

  return new Promise(
    function(resolve, reject) {
      this.client.get(key, function(err, reply) {
        if (err) {
          reject(err);
        } else if (typeof reply !== 'string') {
          resolve();
        } else {
          resolve(JSON.parse(reply.toString()));
        }
      });
    }.bind(this)
  );
};

/**
 * Get a key
 */
RedisCache.prototype.keys = function keys(search) {
  if (typeof search !== 'string') {
    return Promise.reject(new TypeError('search is not a string'));
  }

  if (this.logger) {
    this.logger.silly('Gettings keysL %s', search);
  }

  return new Promise(
    function(resolve, reject) {
      this.client.keys(search, function(err, reply) {
        if (err) {
          reject(err);
        } else {
          resolve(
            reply.map(function(item) {
              return JSON.parse(item.toString());
            })
          );
        }
      });
    }.bind(this)
  );
};

/**
 * Set and expire after 12 hours by default
 */
RedisCache.prototype.set = function set(key, body, options) {
  if (typeof key !== 'string') {
    return Promise.reject(new TypeError('key is not a string'));
  }

  options = Object.assign(
    {
      expires: 60 * 60 * 12,
    },
    options
  );

  if (this.logger) {
    this.logger.silly('Setting %s to', key, body);
  }

  return new Promise(
    function(resolve, reject) {
      this.client.set(
        key,
        JSON.stringify(body),
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          // Skip Expires
          if (typeof options.expires !== 'number' || options.expires === 0) {
            resolve(body);
            return;
          }

          if (this.logger) {
            this.logger.silly('Expiring %s after %ss', key, options.expires);
          }

          this.client.expire(key, options.expires, function(e) {
            if (e) {
              reject(e);
            } else {
              resolve(body);
            }
          });
        }.bind(this)
      );
    }.bind(this)
  );
};

/**
 * Delete old key
 */
RedisCache.prototype.del = function del(key) {
  if (typeof key !== 'string') {
    return Promise.reject(new TypeError('key is not a string'));
  }

  if (this.logger) {
    this.logger.silly('Deleting %s to', key);
  }

  return new Promise(
    function(resolve, reject) {
      this.client.del(key, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    }.bind(this)
  );
};

module.exports = RedisCache;
