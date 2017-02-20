'use strict';

var setupConfig = require('../src/setup/config');

var Original = {
  rc: require('./helpers/config_rc.json'),
  config: require('../config/default.js')
};

function testConfig(obj) {
  return Object.assign({
    rc: './spec/helpers/config_rc.json'
  }, obj);
}

describe('config', function(){
  it('should export a function', function() {
    expect(typeof setupConfig).toBe('function');
  });

  it('should return an object', function() {
    var result = setupConfig(testConfig());
    expect(typeof result).toBe('object');
  });

  it('should take custom options', function() {
    var result = setupConfig(testConfig({
      test: true
    }));
    expect(result.test).toBe(true);
  });

  it('should read from the default config', function(){
    var result = setupConfig(testConfig());
    expect(result.port).toBe(Original.config.port);
  });

  it('should read from the a custom rc file', function(){
    var result = setupConfig(testConfig());
    expect(result.env).toBe(Original.rc.env);
  });

	it('should throw an error if the machine config does not exist', function(){
		expect(function(){
			setupConfig({
				rc: './spec/helpers/missing.json'
			});
		}).toThrow();
	});

	it('should not throw an error if the environment config does not exist', function(){
		expect(function(){
			setupConfig(testConfig({
				env: 'test'
			}));
		}).not.toThrow();
	});
});
