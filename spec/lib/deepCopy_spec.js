'use strict';

var deepCopy = require('../../src/lib/deepCopy');

describe('deepCopy', function(){
  it('should export a function', function() {
    expect(typeof deepCopy).toBe('function');
  });

  it('should return array type if input is an array', function() {
    var obj1 = [
      {
        name: 'test1',
        test1: false
      },
      {
        name: 'test2',
        test2: true
      }
  ];

    var result = deepCopy(obj1);

    expect(typeof result).toBe(typeof obj1);
  });

  it('should return object type if input is an object', function() {
    var obj1 = {
        name: 'test1',
        test1: false
      };
    var result = deepCopy(obj1);

    expect(typeof result).toBe(typeof obj1);
  });

  it('should return object type if input is a date', function() {
    var obj1 = {
      d: new Date()
    };
    var result = deepCopy(obj1);

    expect(typeof result).toBe(typeof obj1);
    expect(result.d).toEqual(obj1.d);
  });

  it('should deeply copy an object', function() {
    var obj = {
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

    var result = deepCopy(obj);

    expect(result.config.port).toBe(obj.config.port);
    expect(result.config.deepConfig.ssl).toBe(obj.config.deepConfig.ssl);
  });

  it('should deeply copy an array of objects', function() {
    var arr = [
      {
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
      },
      {
        name: 'test2',
        test: false,
        config: {
          host: 'test2.com',
          port: 4000,
          deepConfig: {
            db: 1,
            ssl: true
          },
          cache: {
            type: 'test2'
          }
        }
      }
    ];

    var result = deepCopy(arr);

    expect(result.length).toEqual(arr.length);
    expect(result[0].config.port).toBe(arr[0].config.port);
    expect(result[1].config.deepConfig.ssl).toBe(arr[1].config.deepConfig.ssl);
  });

  it('should copy the object correctly, no reference copy', function() {
    // Making sure it's actually copy
    // and not reference copy
    var obj = {
      first: 'test 1',
      second: true
    };

    var result = deepCopy(obj);

    // There are not a same object in memory
    expect(result).not.toBe(obj);
    expect(result.first).toEqual(obj.first);

    // Now changing the source object,
    // but result object should not be changed
    obj.second = false;

    expect(result.second).not.toEqual(obj.second);
  });

  it('should copy the object correctly, not mutate', function() {
    // Mutating a source object should have
    // no effect on the result object
    var a = {
      test: true
    };

    var result = deepCopy(a);
    result.changed = true;

    expect(result.changed).not.toBe(a.changed);
  });
});
