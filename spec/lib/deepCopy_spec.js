const deepCopy = require('../../src/lib/deepCopy');

describe('deepCopy', () => {
  it('should export a function', () => {
    expect(typeof deepCopy).toBe('function');
  });

  it('should return array type if input is an array', () => {
    const obj1 = [
      {
        name: 'test1',
        test1: false,
      },
      {
        name: 'test2',
        test2: true,
      },
    ];

    const result = deepCopy(obj1);

    expect(typeof result).toBe(typeof obj1);
  });

  it('should return object type if input is an object', () => {
    const obj1 = {
      name: 'test1',
      test1: false,
    };
    const result = deepCopy(obj1);

    expect(typeof result).toBe(typeof obj1);
  });

  it('should return object type if input is a date', () => {
    const obj1 = {
      d: new Date(),
    };
    const result = deepCopy(obj1);

    expect(typeof result).toBe(typeof obj1);
    expect(result.d).toEqual(obj1.d);
  });

  it('should deeply copy an object', () => {
    const obj = {
      name: 'test',
      test: false,
      config: {
        host: 'test.com',
        port: 3000,
        deepConfig: {
          db: 0,
          ssl: false,
        },
        cache: {
          type: 'test',
        },
      },
    };

    const result = deepCopy(obj);

    expect(result.config.port).toBe(obj.config.port);
    expect(result.config.deepConfig.ssl).toBe(obj.config.deepConfig.ssl);
  });

  it('should deeply copy an array of objects', () => {
    const arr = [
      {
        name: 'test',
        test: false,
        config: {
          host: 'test.com',
          port: 3000,
          deepConfig: {
            db: 0,
            ssl: false,
          },
          cache: {
            type: 'test',
          },
        },
      },
      {
        name: 'test2',
        test: false,
        config: {
          host: 'test2.com',
          port: 4000,
          deepConfig: {
            db: 1,
            ssl: true,
          },
          cache: {
            type: 'test2',
          },
        },
      },
    ];

    const result = deepCopy(arr);

    expect(result.length).toEqual(arr.length);
    expect(result[0].config.port).toBe(arr[0].config.port);
    expect(result[1].config.deepConfig.ssl).toBe(arr[1].config.deepConfig.ssl);
  });

  it('should copy the object correctly, not mutate', () => {
    // Mutating a source object should have
    // no effect on the result object
    const a = {
      test: true,
    };

    const result = deepCopy(a);
    result.changed = true;

    expect(result.changed).not.toBe(a.changed);
  });
});
