const Promise = require('bluebird');
const moment = require('moment');
const { BookshelfModel } = require('../../src/models/BookshelfModel');

describe('BookshelfModel', () => {
  let mockModelSettings;
  let mockModel;

  beforeEach(() => {
    mockModelSettings = {
      initialized: true,
      fetchCalled: 0,
      fetchAllCalled: 0,
      saveCalled: 0,
      destroyCalled: 0,
      database: {
        knex: {
          raw() {
            return Promise.resolve();
          },
        },
        Model: {
          extend() {
            // Mock Bookshelf ORM
            function Mock(attributes) {
              if (attributes && attributes.id) {
                this.id = attributes.id;
              } else {
                this.id = 1;
              }

              // Mock DATA
              this.attributes = attributes || {};
            }

            // Mock FETCH
            Mock.prototype.fetch = function fetch() {
              if (typeof this.id === 'undefined') {
                throw new Error('missing id');
              }
              mockModelSettings.fetchCalled += 1;
              return Promise.resolve(
                Object.assign(
                  {
                    id: this.id,
                  },
                  this.attributes
                )
              );
            };

            // Mock FETCH
            Mock.prototype.destroy = function destroy() {
              if (typeof this.id === 'undefined') {
                throw new Error('missing id');
              }
              mockModelSettings.destroyCalled += 1;
              return Promise.resolve();
            };

            // Mock FETCH_ALL
            Mock.fetchAll = function fetchAll() {
              mockModelSettings.fetchAllCalled += 1;
              return Promise.resolve([
                Object.assign(
                  {
                    id: 1,
                  },
                  this.attributes
                ),
              ]);
            };

            Mock.where = function where() {
              return Mock;
            };

            // Mock SAVE
            Mock.prototype.save = function save(body) {
              this.id = 1;
              this.attributes = body;
              mockModelSettings.saveCalled += 1;
              return Promise.resolve(this);
            };

            return Mock;
          },
        },
      },
    };

    mockModel = new BookshelfModel(mockModelSettings);
  });

  it('should be extend itself from the base model', () => {
    const where = () => {};
    mockModelSettings.database.Model.extend = () => {
      return {
        where,
      };
    };
    const model = new BookshelfModel(mockModelSettings);
    expect(typeof model.where).toBe('function');
  });

  it('should throw an error if you try to override a method on the base orm', () => {
    mockModelSettings.read = () => {};
    mockModelSettings.database.Model.extend = () => {
      return {
        read() {},
      };
    };
    expect(() => {
      new BookshelfModel(mockModelSettings); // eslint-disable-line
    }).toThrow();
  });

  it('should have a create method the calls this.model.save()', done => {
    expect(() => {
      mockModel
        .create({
          test: true,
        })
        .then(result => {
          expect(typeof result.id).toBe('number');
          expect(mockModelSettings.saveCalled).toBe(1);
          done();
        });
    }).not.toThrow();
  });

  it('should have a read method that accepts a number id and calls fetch()', done => {
    mockModel.read(1).then(result => {
      expect(typeof result).toBe('object');
      expect(result.id).toBe(1);
      expect(mockModelSettings.fetchCalled).toBe(1);
      done();
    });
  });

  it('should have a read method that accepts a object and extracts the id and calls fetch()', done => {
    mockModel
      .read({
        id: 1,
      })
      .then(result => {
        expect(typeof result).toBe('object');
        expect(mockModelSettings.fetchCalled).toBe(1);
        expect(result.id).toBe(1);
        done();
      });
  });

  it('should have a read that accepts an array of ids and calls fetchAll()', done => {
    mockModel.read([1]).then(result => {
      expect(result instanceof Array).toBe(true);
      expect(mockModelSettings.fetchAllCalled).toBe(1);
      expect(result[0].id).toBe(1);
      done();
    });
  });

  it('should have a readAll method that calls fetchAll', done => {
    mockModel.readAll().then(result => {
      expect(result instanceof Array).toBe(true);
      expect(mockModelSettings.fetchAllCalled).toBe(1);
      expect(result[0].id).toBe(1);
      done();
    });
  });

  it('should have a find method that calls fetch()', done => {
    mockModel
      .find({
        id: 1,
      })
      .then(result => {
        expect(typeof result).toBe('object');
        expect(result.id).toBe(1);
        expect(mockModelSettings.fetchCalled).toBe(1);
        done();
      });
  });

  it('should have a update method that calls save() and  fetch()', done => {
    mockModel
      .update({
        id: 1,
      })
      .then(result => {
        expect(typeof result).toBe('object');
        expect(result.id).toBe(1);
        expect(mockModelSettings.saveCalled).toBe(1);
        expect(mockModelSettings.fetchCalled).toBe(1);
        done();
      });
  });

  it('should have a updateAll method that saves an array of objects', done => {
    mockModel
      .updateAll([
        {
          id: 1,
        },
      ])
      .then(result => {
        expect(result instanceof Array).toBe(true);
        expect(mockModelSettings.saveCalled).toBe(1);
        expect(mockModelSettings.fetchCalled).toBe(1);
        done();
      });
  });

  it('should have a del method that calls destroy', done => {
    mockModel.del(1).then(() => {
      expect(mockModelSettings.destroyCalled).toBe(1);
      done();
    });
  });

  describe('convertTimestampsToUnix', () => {
    it('should convert fields to timestamps', () => {
      const now = new Date();
      const results = BookshelfModel.convertTimestampsToUnix()({
        id: 1,
        created_at: now,
      });
      expect(results.created_at).toBe(now.getTime().toString());
    });

    it('should convert fields to timestamps in camelCase', () => {
      const now = new Date();
      const results = BookshelfModel.convertTimestampsToUnix(['createdAt'], { camelCase: true })({
        id: 1,
        created_at: now,
      });
      expect(results.createdAt).toBe(now.getTime().toString());
    });
  });

  describe('convertDatesToISO8601', () => {
    it('should to convert fields to ISO8601', () => {
      const now = new Date();
      const results = BookshelfModel.convertDatesToISO8601()({
        id: 1,
        created_at: now,
      });
      expect(results.created_at).toBe(
        moment(now)
          .utc()
          .format()
      );
    });

    it('should to convert fields to ISO8601 in camelCase', () => {
      const now = new Date();
      const results = BookshelfModel.convertDatesToISO8601(['createdAt'], { camelCase: true })({
        id: 1,
        created_at: now,
      });
      expect(results.createdAt).toBe(
        moment(now)
          .utc()
          .format()
      );
    });
  });
});
