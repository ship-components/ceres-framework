const controllerRouter = require('../../src/controllers/Router');

describe('controllerRouter', () => {
  let controller;
  let ceres;
  const getAll = function getAll() {};
  const putOne = function putOne() {};

  beforeEach(() => {
    controller = {
      endpoint: '/',
      name: 'TestController',
      routes: {},
    };
    ceres = {
      log: {
        internal: {
          silly() {},
          warn: console.error,
          error: console.error,
        },
      },
    };
  });

  it('should export a function', () => {
    expect(typeof controllerRouter).toBe('function');
  });

  it('should return a function', () => {
    const result = controllerRouter.call(controller, ceres);
    expect(typeof result).toBe('function');
  });

  it('should throw an error if routes are missing', () => {
    expect(() => {
      controllerRouter.call({}, ceres);
    }).toThrow();
  });

  describe('controllerRouter', () => {
    it('should return an array of objects based on routes', () => {
      const expected = [
        {
          method: 'get',
          args: ['/', getAll],
        },
        {
          method: 'put',
          args: ['/test', putOne],
        },
      ];
      const routes = {};
      expected.forEach(function(route) {
        routes[`${route.method} ${route.args[0]}`] = route.args[1];
      });
      controller.routes = routes;
      const result = controllerRouter.routes(controller, ceres);

      expect(result instanceof Array).toBe(true);
      expect(result.length).toBe(expected.length);
      result.forEach(function(route, index) {
        expect(route.method).toBe(expected[index].method);
        expect(route.args[0]).toBe(expected[index].args[0]);
        expect(typeof route.args[1]).toBe('function');
      });
    });

    it('should accept middleware on a per route basis', () => {
      controller.routes = {
        'get /': [function middleware() {}, getAll],
      };

      const result = controllerRouter.routes(controller, ceres);
      result.forEach(function(route) {
        expect(typeof route.args[1]).toBe('function');
        expect(typeof route.args[2]).toBe('function');
      });
    });

    it('should accept middleware on a per controller basis', () => {
      controller.routes = {
        'get /': getAll,
        'put /': putOne,
      };
      controller.middleware = [function middleware() {}];

      const result = controllerRouter.routes(controller, ceres);
      result.forEach(function(route) {
        expect(typeof route.args[1]).toBe('function');
        expect(typeof route.args[2]).toBe('function');
      });
    });

    it('should accept string names of the default methods', () => {
      controller.routes = {
        'get /': 'getAll',
      };
      controller.getAll = getAll;
      const result = controllerRouter.routes(controller, ceres);

      expect(result instanceof Array).toBe(true);
      result.forEach(function(route) {
        expect(typeof route.args[1]).toBe('function');
      });
    });

    it('should throw an error if it is not a valid httpd method', () => {
      controller.routes = {
        'wtf /': 'getAll',
      };
      controller.getAll = getAll;
      expect(() => {
        controllerRouter.routes(controller, ceres);
      }).toThrow();
    });

    it('should throw an error if it can not find a function', () => {
      controller.routes = {
        'wtf /': 'doesNotExist',
      };
      expect(() => {
        controllerRouter.routes(controller, ceres);
      }).toThrow();
    });
  });
});
