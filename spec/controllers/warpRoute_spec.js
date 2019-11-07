const Promise = require('bluebird');
const wrapRoute = require('../../src/controllers/wrapRoute');

describe('wrapRoute', () => {
  let ceres;

  beforeEach(() => {
    ceres = {
      log: {
        internal: {
          debug() {},
        },
      },
    };
  });

  it('should return a function', () => {
    function handler() {}
    const ctx = {};
    let result;
    expect(() => {
      result = wrapRoute(handler, ctx, ceres);
    }).not.toThrow();
    expect(typeof result).toBe('function');
  });

  it('should extend "this" with any custom properties', () => {
    let result;
    function handler() {
      result = this;
    }
    const ctx = {
      extend: true,
    };
    expect(() => {
      const wrappedFunction = wrapRoute(handler, ctx, ceres);
      wrappedFunction().finally(() => {
        expect(result.extend).toBe(ctx.extend);
      });
    }).not.toThrow();
  });

  it('should assign "req", "res", "next" to "this" of the handler', () => {
    let result;
    function handler() {
      result = this;
    }
    const ctx = {};

    const req = {};
    const res = {};
    const next = () => {};
    expect(() => {
      const wrappedFunction = wrapRoute(handler, ctx, ceres);
      wrappedFunction(req, res, next).finally(() => {
        expect(result.req).toBe(req);
        expect(result.res).toBe(res);
        expect(result.next).toBe(next);
      });
    }).not.toThrow();
  });

  it('should call the "next" handler if theres an error', () => {
    const err = new Error('ERROR');
    const handler = () => {
      throw err;
    };
    const ctx = {};
    const next = jest.fn();
    const wrappedFunction = wrapRoute(handler, ctx, ceres);
    wrappedFunction({}, {}, next).then(() => {
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  it('should automatically "send" the result of a promise', done => {
    const expected = {
      results: [],
    };
    const handler = () => expected;
    const ctx = {
      send: jest.fn(),
    };
    const res = {
      writable: true,
      headerSent: false,
    };
    const fn = wrapRoute(handler, ctx, ceres);
    fn({}, res, () => {})
      .then(() => {
        expect(ctx.send).toHaveBeenCalledWith(expected);
      })
      .finally(() => {
        done();
      });
  });

  it('should not write the response if is not writable', () => {
    const expected = {
      results: [],
    };
    function handler() {
      return new Promise(resolve => {
        resolve(expected);
      });
    }
    const ctx = {
      send: jest.fn(),
    };
    const res = {
      writable: false,
    };
    const fn = wrapRoute(handler, ctx, ceres);
    return fn({}, res, () => {}).then(() => {
      expect(ctx.send).not.toHaveBeenCalled();
    });
  });
});
