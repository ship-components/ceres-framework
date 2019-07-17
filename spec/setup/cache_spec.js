const setupCache = require('../../src/setup/cache');

describe('cache', () => {
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

  it('should return a promise with the cache as the result', done => {
    setupCache(ceres).then(function(cache) {
      expect(cache).not.toBeDefined();
      done();
    });
  });
});
