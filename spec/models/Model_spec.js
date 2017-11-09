'use strict';

var Model = require('../../src/models/Model');

describe('Model', function(){
	var ceres;

	beforeEach(function(){
		ceres = {
			config: {
				db: {
					type: 'bookshelf'
				}
			},
			Database: {
				bookshelf: {
					Model: {
						extend: function() {}
					},
					knex: {
						raw: function() {}
					}
				}
			}
		};
	});

	it('should throw an error if it does not recognize the type', function(){
		expect(function(){
			new Model(ceres, {
				type: 'badType'
			});
		}).toThrow();
	});

	it('should call the init function if provided', function(){
		var spy = jest.fn();
		var model = new Model(ceres, {
			init: spy
		});
		expect(model).toBeDefined();
		expect(spy).toHaveBeenCalled();
	});

	it('should have a extend function', function(){
		var model;
		expect(function(){
			model = Model.extend.call(ceres, {
				test: function(){}
			});
		}).not.toThrow();
		expect(model).toBeDefined();
		expect(typeof model.test).toBe('function');
	});

});
