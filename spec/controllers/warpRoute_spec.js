const Promise = require('bluebird');
const wrapRoute = require('../../src/controllers/wrapRoute');

describe('wrapRoute', function() {
  let ceres;

  beforeEach(function() {
    ceres = {
      log: {
        _ceres: {
          debug() {},
        },
      },
    };
  });

  it('should return a function', function() {
    const handler = function() {};
    const ctx = {};
    let result;
    expect(function() {
      result = wrapRoute(handler, ctx, ceres);
    }).not.toThrow();
    expect(typeof result).toBe('function');
  });

  it('should extend "this" with any custom properties', function() {
    let result;
    const handler = function() {
      result = this;
    };
    const ctx = {
      extend: true,
    };
    expect(function() {
      const wrappedFunction = wrapRoute(handler, ctx, ceres);
      wrappedFunction().finally(() => {
        expect(result.extend).toBe(ctx.extend);
      });
    }).not.toThrow();
  });

  it('should assign "req", "res", "next" to "this" of the handler', function() {
    let result;
    const handler = function() {
      result = this;
    };
    const ctx = {};

    const req = {};
    const res = {};
    const next = function() {};
    expect(function() {
      const wrappedFunction = wrapRoute(handler, ctx, ceres);
      wrappedFunction(req, res, next).finally(() => {
        expect(result.req).toBe(req);
        expect(result.res).toBe(res);
        expect(result.next).toBe(next);
      });
    }).not.toThrow();
  });

  it('should call the "next" handler if theres an error', function() {
    const err = new Error('ERROR');
    const handler = function() {
      throw err;
    };
    const ctx = {};
    const next = jest.fn();
    const wrappedFunction = wrapRoute(handler, ctx, ceres);
    wrappedFunction({}, {}, next).then(() => {
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  it('should automatically "send" the result of a promise', function(done) {
    const expected = {
      results: [],
    };
    const handler = function() {
      return new Promise(function(resolve) {
        resolve(expected);
      });
    };
    const ctx = {
      send: jest.fn(),
    };
    const res = {
      writable: true,
    };
    const fn = wrapRoute(handler, ctx, ceres);
    fn({}, res, function() {})
      .then(function() {
        expect(ctx.send).toHaveBeenCalledWith(expected);
      })
      .finally(() => {
        done();
      });
  });

  it('should not write the response if is not writable', function(done) {
    const expected = {
      results: [],
    };
    const handler = function() {
      return new Promise(function(resolve) {
        resolve(expected);
      });
    };
    const ctx = {
      send: jest.fn(),
    };
    const res = {
      writable: false,
    };
    const fn = wrapRoute(handler, ctx, ceres);
    fn({}, res, function() {}).then(function() {
      expect(ctx.send).not.toHaveBeenCalled();
      done();
    });
  });
});
