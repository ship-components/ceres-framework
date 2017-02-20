'use strict';
var controllerRouter = require('../../src/controllers/Router');

describe('controllerRouter', function(){
	var controller;
	var ceres;
	var getAll = function getAll() {};
	var putOne = function putOne(){};

	beforeEach(function(){
		controller = {
			endpoint: '/',
			name: 'TestController',
			routes: {}
		};
		ceres = {
			log: {
				_ceres: {
					silly: function(){},
					warn: console.error,
					error: console.error
				}
			}
		};
	});

  it('should export a function', function() {
    expect(typeof controllerRouter).toBe('function');
  });

	it('should return a function', function() {
		var result = controllerRouter.call(controller, ceres);
		expect(typeof result).toBe('function');
	});

	it('should throw an error if routes are missing', function(){
		expect(function(){
			controllerRouter.call({}, ceres);
		}).toThrow();
	});

	describe('controllerRouter', function(){
		it('should return an array of objects based on routes', function(){
			var expected = [
				{
					method: 'get',
					args: ['/', getAll]
				},
				{
					method: 'put',
					args: ['/test', putOne]
				}
			];
			var routes = {};
			expected.forEach(function(route){
				routes[route.method + ' ' + route.args[0]] = route.args[1];
			});
			controller.routes = routes;
			var result = controllerRouter.routes(controller, ceres);

			expect(result instanceof Array).toBe(true);
			expect(result.length).toBe(expected.length);
			result.forEach(function(route, index){
				expect(route.method).toBe(expected[index].method);
				expect(route.args[0]).toBe(expected[index].args[0]);
				expect(typeof route.args[1]).toBe('function');
			});
		});


		it('should accept middleware on a per route basis', function(){
			controller.routes = {
				'get /' : [function middleware(){}, getAll]
			};

			var result = controllerRouter.routes(controller, ceres);
			result.forEach(function(route){
				expect(typeof route.args[1]).toBe('function');
				expect(typeof route.args[2]).toBe('function');
			});
		});

		it('should accept middleware on a per controller basis', function(){
			controller.routes = {
				'get /' : getAll,
				'put /' : putOne
			};
			controller.middleware = [function middleware(){}];

			var result = controllerRouter.routes(controller, ceres);
			result.forEach(function(route){
				expect(typeof route.args[1]).toBe('function');
				expect(typeof route.args[2]).toBe('function');
			});
		});

		it('should accept string names of the default methods', function(){
			controller.routes = {
				'get /' : 'getAll'
			};
			controller.getAll = getAll;
			var result = controllerRouter.routes(controller, ceres);

			expect(result instanceof Array).toBe(true);
			result.forEach(function(route){
				expect(typeof route.args[1]).toBe('function');
			});
		});

		it('should throw an error if it is not a valid httpd method', function(){
			controller.routes = {
				'wtf /' : 'getAll'
			};
			controller.getAll = getAll;
			expect(function(){
				controllerRouter.routes(controller, ceres);
			}).toThrow();
		});

		it('should throw an error if it can not find a function', function(){
			controller.routes = {
				'wtf /' : 'doesNotExist'
			};
			expect(function(){
				controllerRouter.routes(controller, ceres);
			}).toThrow();
		});

	});
});
