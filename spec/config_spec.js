'use strict';

var Config = require('../src/setup/Config');

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
    expect(typeof Config).toBe('function');
  });

  it('should return an object', function() {
    var result = new Config(testConfig());
    expect(typeof result).toBe('object');
  });

  it('should take custom options', function() {
    var result = new Config(testConfig({
      test: true
    }));
    expect(result.test).toBe(true);
  });

  it('should read from the default config', function(){
    var result = new Config(testConfig());
    expect(result.port).toBe(Original.config.port);
  });

  it('should read from the a custom rc file', function(){
    var result = new Config(testConfig());
    expect(result.env).toBe(Original.rc.env);
  });

	it('should throw an error if the machine config does not exist', function(){
		expect(function(){
			var result = new Config({
				rc: './spec/helpers/missing.json'
			});
      expect(typeof result).toBe('object');
		}).toThrow();
	});

	it('should not throw an error if the environment config does not exist', function(){
		expect(function(){
			var result = new Config(testConfig({
				env: 'does not exist'
			}));
      expect(typeof result).toBe('object');
		}).not.toThrow();
	});

  it('should throw an error if the environment config has an error', function(){
		expect(function(){
			var result = new Config(testConfig({
        configFolder: './spec/helpers/errors',
				env: 'TestErrorConfig'
			}));
      expect(typeof result).toBe('object');
		}).toThrow();
	});

  it('should throw an error if the environment config does not return an object', function(){
		expect(function(){
			var result = new Config(testConfig({
        configFolder: './spec/helpers/errors',
				env: 'TestErrorReturnUndefined'
			}));
      expect(typeof result).toBe('object');
		}).toThrow();
	});

});
