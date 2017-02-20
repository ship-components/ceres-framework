var express = require('express');
var setupRoutes = require('../../src/setup/routes');
var TestController = require('../helpers/TestController');

describe('routes', function(){
	var ceres;
	var ran = false;

	beforeEach(function(){
		ran = false;
		// Setup mock router
		TestController.router = function() {
			ran = true;
			return new express.Router();
		};

		ceres = {
			log: {
				_ceres: {
					silly: function() {},
					error: console.error
				}
			},
			config: {
				cache: false,
				folders: {
					controllers: '.'
				}
			}
		};
	});

	it('should call the router function on controller', function(){
		ceres.config.controllers = {
			'./spec/helpers/TestController': '/'
		};
		var router = setupRoutes(ceres, 'controllers');
		expect(typeof router).toBe('function');
		expect(ran).toBe(true);
	});
});
