const Model = require('../../src/models/Model');

describe('Model', () => {
  let ceres;

  beforeEach(() => {
    ceres = {
      config: {
        db: {
          type: 'bookshelf',
        },
      },
      Database: {
        bookshelf: {
          Model: {
            extend() {},
          },
          knex: {
            raw() {},
          },
        },
      },
    };
  });

  it('should throw an error if it does not recognize the type', () => {
    expect(() => {
      new Model(ceres, {
        type: 'badType',
      });
    }).toThrow();
  });

  it('should call the init function if provided', () => {
    const spy = jest.fn();
    const model = new Model(ceres, {
      init: spy,
    });
    expect(model).toBeDefined();
    expect(spy).toHaveBeenCalled();
  });

  it('should have a extend function', () => {
    let model;
    expect(() => {
      model = Model.extend.call(ceres, {
        test() {},
      });
    }).not.toThrow();
    expect(model).toBeDefined();
    expect(typeof model.test).toBe('function');
  });
});
