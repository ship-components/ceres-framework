const Model = require('../../src/models/Model');

describe('Model.bookself', () => {
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

  it('should include the basic CRUD functions', () => {
    let model;
    expect(() => {
      model = new Model(ceres, {});
    }).not.toThrow();
    expect(typeof model.read).toBe('function');
    expect(typeof model.readAll).toBe('function');
    expect(typeof model.create).toBe('function');
    expect(typeof model.update).toBe('function');
    expect(typeof model.updateAll).toBe('function');
    expect(typeof model.del).toBe('function');
    expect(typeof model.find).toBe('function');
  });

  it('should be extendable', () => {
    const model = new Model(ceres, {
      randomMethod() {},
    });
    expect(typeof model.randomMethod).toBe('function');
  });

  it('should make an alias to the knex.raw function', () => {
    ceres.Database.bookshelf.knex.raw = jest.fn();
    const model = new Model(ceres, {});
    model.raw();
    expect(ceres.Database.bookshelf.knex.raw).toHaveBeenCalled();
  });
});
