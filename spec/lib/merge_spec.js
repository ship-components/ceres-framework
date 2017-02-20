'use strict';

var merge = require('../../src/lib/merge');

describe('merge', function(){
  it('should export a function', function() {
    expect(typeof merge).toBe('function');
  });

  it('should merge two objects', function() {
    var obj1 = {
      name: 'test',
      test: false
    };

    var obj2 = {
      test: true
    };

    var result = merge(obj1, obj2);

    expect(result.test).toBe(obj2.test);
    expect(result.name).toBe(obj1.name);
  });

  it('should modify the original object', function() {
    var obj1 = {};
    var obj2 = {
      name: 'test'
    };

    merge(obj1, obj2);

    expect(obj1.name).toBe(obj2.name);
  });

  it('should return the result', function() {
    var obj1 = {};
    var obj2 = {
      name: 'test'
    };

    var result = merge(obj1, obj2);

    expect(result).toBe(obj1);
  });

  it('should NOT deeply merge an array', function() {
    var obj1 = {
      arr: ['one']
    };
    var obj2 = {
      arr: ['two', 'three']
    };

    var result = merge(obj1, obj2);

    expect(result.arr.length).toBe(obj2.arr.length);
  });

  it('should merge multiple objects', function() {
    var obj1 = {
      name: 'one'
    };

    var obj2 = {
      name: 'two'
    };

    var obj3 = {
      name: 'three'
    };

    var result = merge(obj1, obj2, obj3);

    expect(result.name).toBe(obj3.name);
  });

  it('should ignored undefined values', function() {
    var obj1 = {
      port: 3000,
      name: 'test'
    };

    var obj2 = {
      port: void 0
    };

    var result = merge(obj1, obj2);

    expect(result.port).toBe(obj1.port);
    expect(result.name).toBe(obj1.name);
  });

  it('should deeply merge two objects', function() {
    var obj1 = {
      name: 'test',
      test: false,
      config: {
        host: 'test.com',
        port: 3000,
        deepConfig: {
          db: 0,
          ssl: false
        },
        cache: {
          type: 'test'
        }
      }
    };

    var obj2 = {
      test: true,
      config: {
        port: 5000,
        deepConfig: {
          db: 1,
          ssl: true
        },
        cache: false
      }
    };

    var result = merge(obj1, obj2);

    expect(result.config.port).toBe(obj2.config.port);
    expect(result.config.host).toBe(obj1.config.host);
    expect(result.config.deepConfig.db).toBe(obj2.config.deepConfig.db);
    expect(result.config.deepConfig.ssl).toBe(obj2.config.deepConfig.ssl);
    expect(result.config.cache).toBe(obj2.config.cache);
  });
});
