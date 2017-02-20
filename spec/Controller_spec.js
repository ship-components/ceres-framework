'use strict';

var ControllerModule = require('../src/controllers/Controller');

describe('Ceres', function(){
	var Controller;
  it('should export a function', function() {
    expect(typeof ControllerModule).toBe('function');
  });

	beforeEach(function(){
		var ctx = {};
		Controller = ControllerModule.bind(ctx, ctx);
	});

	it('should extend itself', function(){
		var example = 'test';
		var controller = new Controller({
			example: example
		});
		expect(controller.example).toBe(example);
	});

	it('should have a static extend helper method', function(){
		var example = 'test';
		var controller = ControllerModule.extend({
			example: example
		});
		expect(controller.example).toBe(example);
		expect(controller instanceof ControllerModule).toBeTruthy();
	});

	it('should have some fethod methods',function(){
		var controller = new Controller();
		expect(typeof controller.getAll).toBe('function');
		expect(typeof controller.getOne).toBe('function');
		expect(typeof controller.postCreate).toBe('function');
		expect(typeof controller.putUpdate).toBe('function');
		expect(typeof controller.deleteOne).toBe('function');
	});

});
