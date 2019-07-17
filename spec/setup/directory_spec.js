const fs = require('fs');
const setupDirectory = require('../../src/setup/directory');

const helpersDirectory = './spec/helpers/';
const jsTest = /\.jsx?$/i;

describe('routes', function() {
  let jsFiles = [];
  beforeEach(function() {
    jsFiles = fs.readdirSync(helpersDirectory).filter(function(file) {
      return jsTest.test(file);
    });
  });

  it('should load any .js files in a directory and return an object of results', function() {
    const result = setupDirectory(helpersDirectory);
    expect(typeof result).toBe('object');

    jsFiles.forEach(function(filename) {
      // get the filename with the extension
      const name = filename.replace(jsTest, '');
      expect(result[name]).toBeDefined();
    });
  });

  it('should run any .js files in a directory and call any functions', function() {
    const result = setupDirectory(helpersDirectory, {
      config: {
        test: true,
      },
    });
    expect(result.TestController.test).toBe(true);
    expect(typeof result.TestConfig).toBe('object');
  });
});
