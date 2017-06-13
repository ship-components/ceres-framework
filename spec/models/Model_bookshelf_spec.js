'use strict';

var Model = require('../../src/models/Model');

describe('Model.bookself', function(){
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

	it('should include the basic CRUD functions', function(){
		var model;
		expect(function(){
			model = new Model(ceres, {});
		}).not.toThrow();
		expect(typeof model.read).toBe('function');
		expect(typeof model.readAll).toBe('function');
		expect(typeof model.create).toBe('function');
		expect(typeof model.update).toBe('function');
		expect(typeof model.updateAll).toBe('function');
		expect(typeof model.del).toBe('function');
		expect(typeof model.find).toBe('function');
	});

	it('should be extendable', function() {
		var model = new Model(ceres, {
			randomMethod: function() {}
		});
		expect(typeof model.randomMethod).toBe('function');
	});

  it('should make an alias to the knex.raw function', function(){
    ceres.Database.bookshelf.knex.raw = jasmine.createSpy();
    var model = new Model(ceres, {});
		model.raw();
		expect(ceres.Database.bookshelf.knex.raw).toHaveBeenCalled();
  });
});
