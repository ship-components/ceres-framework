'use strict';

var assertNotNull = require('../../src/lib/assert').assertNotNull;
var assertDefined = require('../../src/lib/assert').assertDefined;

describe('assert', function(){

	describe('assertNotNull', function(){

		it('should throw an error when a value is null', function(){
			expect(function(){ // eslint-disable-line
				assertNotNull(null);
			}).toThrow();
		});

		it('should not throw an error when a value is not null', function(){
			expect(function(){ // eslint-disable-line
				assertNotNull('');
				assertNotNull(1);
				assertNotNull({});
				assertNotNull([]);
				assertNotNull(function(){}); // eslint-disable-line
			}).not.toThrow();
		});

	});


	describe('assertDefined', function(){

		it('should throw an error when a value is not defined', function(){
			expect(function(){ // eslint-disable-line
				assertDefined(void 0);
			}).toThrow();
		});

		it('should not throw an error when a value is defined', function(){
			expect(function(){ // eslint-disable-line
				assertDefined('');
				assertDefined(1);
				assertDefined({});
				assertDefined([]);
				assertDefined(function(){}); // eslint-disable-line
			}).not.toThrow();
		});

	});

});
