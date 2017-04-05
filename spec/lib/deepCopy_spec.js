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
    expect(result.config.host).toBe(obj.config.host);
    expect(result.config.deepConfig.db).toBe(obj.config.deepConfig.db);
    expect(result.config.deepConfig.ssl).toBe(obj.config.deepConfig.ssl);
    expect(result.config.cache.type).toBe(obj.config.cache.type);
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
    expect(result[0].config.host).toBe(arr[0].config.host);
    expect(result[1].config.deepConfig.db).toBe(arr[1].config.deepConfig.db);
    expect(result[1].config.deepConfig.ssl).toBe(arr[1].config.deepConfig.ssl);
    expect(result[1].config.cache.type).toBe(arr[1].config.cache.type);
  });

  it('should copy the object correctly, not reference copy', function() {
    // Making sure it's actually copy
    // and not reference copy
    var tree = {
      'left'  : { 'left' : null, 'right' : null, 'data' : 3 },
      'right' : null,
      'data'  : 8
    };

    var result = deepCopy(tree);

    // There are not a same object in memory
    expect(result).not.toBe(tree);
    expect(result.left).toEqual(tree.left);
    expect(result.right).toEqual(tree.right);

    // Now changing the source object,
    // but result should not be changed
    tree.right = tree.left;

    // There are not a same object in memory
    expect(result).not.toBe(tree);
    expect(result.left).toEqual(tree.left);
    expect(result.right).toEqual(null);
    expect(result.right).not.toEqual(tree.right);
  });

  it('should copy the object correctly, not mutate', function() {
    // Mutating a source object should have
    // no effect on the result object
    var a = {
      test: '1'
    };

    var b = {
      example: '2'
    };

    var test1 = deepCopy(a);
    var test2 = deepCopy(b);

    expect(a).not.toBe(b);
    expect(test1).not.toBe(test2);

    expect(typeof a.example).toBe('undefined');
    expect(typeof test1.example).toBe('undefined');

    expect(typeof b.test).toBe('undefined');
    expect(typeof test2.test).toBe('undefined');

    expect(test1.test).toEqual(a.test);
    expect(test2.example).toEqual(b.example);
  });
});
