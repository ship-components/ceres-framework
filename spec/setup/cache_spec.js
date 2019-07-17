const setupCache = require('../../src/setup/cache');

describe('cache', function() {
  const ceres = {
    logger() {
      return {
        debug() {},
      };
    },
    config: {
      cache: false,
    },
  };

  it('should return a promise with the cache as the result', function(done) {
    setupCache(ceres).then(function(cache) {
      expect(cache).not.toBeDefined();
      done();
    });
  });
});
