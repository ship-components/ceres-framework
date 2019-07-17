/* eslint-disable max-nested-callbacks */

const Config = require('../src/setup/Config');

const Original = {
  rc: require('./helpers/config_rc.json'),
  config: require('../config/default.js'),
};

function testConfig(obj) {
  return Object.assign(
    {
      configFolder: './spec/helpers',
      rc: './spec/helpers/config_rc.json',
    },
    obj
  );
}

describe('config', () => {
  it('should export a function', () => {
    expect(typeof Config).toBe('function');
  });

  it('should return an object', () => {
    const result = new Config(testConfig());
    expect(typeof result).toBe('object');
  });

  it('should take custom options', () => {
    const result = new Config(
      testConfig({
        test: true,
      })
    );
    expect(result.test).toBe(true);
  });

  it('should not throw an error if there is no valid rc file', () => {
    expect(() => {
      new Config({
        rc: 'does-not-exist.json',
      });
    }).not.toThrow();
  });

  it('should read from the default config', () => {
    const result = new Config(testConfig());
    expect(result.port).toBe(Original.config.port);
  });

  it('should read from the a custom rc file', () => {
    const result = new Config(testConfig());
    expect(result.env).toBe(Original.rc.env);
  });

  it('should not throw an error if the machine config does not exist', () => {
    expect(() => {
      const result = new Config({
        rc: './spec/helpers/missing.json',
      });
      expect(typeof result).toBe('object');
    }).not.toThrow();
  });

  it('should not throw an error if the environment config does not exist', () => {
    expect(() => {
      const result = new Config(
        testConfig({
          env: 'does-not-exist',
        })
      );
      expect(typeof result).toBe('object');
    }).not.toThrow();
  });

  it('should throw an error if the environment config has an error', () => {
    expect(() => {
      const result = new Config(
        testConfig({
          configFolder: './spec/helpers/errors',
          env: 'TestErrorConfig',
        })
      );
      expect(typeof result).toBe('object');
    }).toThrow();
  });

  it('should throw an error if the environment config does not return an object', () => {
    expect(() => {
      const result = new Config(
        testConfig({
          configFolder: './spec/helpers/errors',
          env: 'TestErrorReturnUndefined',
        })
      );
      expect(typeof result).toBe('object');
    }).toThrow();
  });

  it('should import a webpack config if it can find it', () => {
    const result = new Config(
      testConfig({
        env: 'client',
      })
    );
    const mockWebpackConfig = require('./helpers/webpack.client');
    expect(typeof result.webpackConfig).toBe('object');
    expect(result.webpackConfig.entry).toBe(mockWebpackConfig.entry);
  });

  it('should let accept additional config in its second argument', () => {
    expect(() => {
      const expectedPort = 4000;
      const result = new Config(undefined, {
        port: expectedPort,
      });
      expect(new Config().port).not.toBe(expectedPort);
      expect(result.port).toBe(expectedPort);
    }).not.toThrow();
  });

  it('should deeply merge environment config over the default config', () => {
    expect(() => {
      const expectedValue = 'test-value';

      const spy = jest.spyOn(Config.prototype, 'requireConfig').mockImplementation(env => {
        if (env === 'test') {
          return {
            env,
            nested: {
              value: expectedValue,
            },
          };
        }
        return {
          env,
          nested: {
            value: 'the-wrong-value',
          },
        };
      });

      const result = new Config({
        env: 'test',
      });

      expect(spy).toHaveBeenCalled();
      expect(result.nested.value).toBe(expectedValue);
      spy.mockClear();
    }).not.toThrow();
  });
});
