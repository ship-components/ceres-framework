'use strict';

var BookshelfModel = require('../../../src/models/types/BookshelfModel');
var Promise = require('bluebird');
var moment = require('moment');

describe('BookshelfModel', function() {
  var mockModelSettings;
  var mockModel;

  beforeEach(function() {
    mockModelSettings = {
      fetchCalled: 0,
      fetchAllCalled: 0,
      saveCalled: 0,
      destroyCalled: 0,
      database: {
        knex: {
          raw: function() {
            return Promise.resolve();
          }
        },
        Model: {
          extend: function() {
            // Mock Bookshelf ORM
            var Mock = function(attributes) {
              if (attributes && attributes.id) {
                this.id = attributes.id;
              } else {
                this.id = 1;
              }

              // Mock DATA
              this.attributes = attributes || {};
            };

            // Mock FETCH
            Mock.prototype.fetch = function(){
              if (typeof this.id === 'undefined') {
                throw new Error('missing id');
              }
              mockModelSettings.fetchCalled += 1;
              return Promise.resolve(Object.assign({
                id: this.id
              }, this.attributes));
            };

            // Mock FETCH
            Mock.prototype.destroy = function(){
              if (typeof this.id === 'undefined') {
                throw new Error('missing id');
              }
              mockModelSettings.destroyCalled += 1;
              return Promise.resolve();
            };

            // Mock FETCH_ALL
            Mock.fetchAll = function(){
              mockModelSettings.fetchAllCalled += 1;
              return Promise.resolve([Object.assign({
                id: 1
              }, this.attributes)]);
            };

            Mock.where = function() {
              return Mock;
            };

            // Mock SAVE
            Mock.prototype.save = function(body) {
              this.id = 1;
              this.attributes = body;
              mockModelSettings.saveCalled += 1;
              return Promise.resolve(this);
            };

            return Mock;
          }
        }
      }
    };

    mockModel = new BookshelfModel(mockModelSettings);
  });

  it('should be extendable', function() {
    mockModelSettings.customMethod = function(){};
    var model = new BookshelfModel(mockModelSettings);
    expect(model.customMethod).toBe(mockModelSettings.customMethod);
  });

  it('should be extend itself from the base model', function() {
    var where = function(){};
    mockModelSettings.database.Model.extend = function() {
      return {
        where: where
      };
    };
    var model = new BookshelfModel(mockModelSettings);
    expect(typeof model.where).toBe('function');
  });

  it('should throw an error if you try to override a method on the base orm', function() {
    mockModelSettings.read = function(){};
    mockModelSettings.database.Model.extend = function() {
      return {
        read: function(){}
      };
    };
    expect(function(){
      new BookshelfModel(mockModelSettings); // eslint-disable-line
    }).toThrow();
  });

  it('should have a create method the calls this.model.save()', function(done){
    expect(function(){
      mockModel.create({
        test: true
      })
      .then(function(result){
        expect(typeof result.id).toBe('number');
        expect(mockModelSettings.saveCalled).toBe(1);
        done();
      });
    }).not.toThrow();
  });

  it('should have a read method that accepts a number id and calls fetch()', function(done){
    mockModel.read(1)
      .then(function(result){
        expect(typeof result).toBe('object');
        expect(result.id).toBe(1);
        expect(mockModelSettings.fetchCalled).toBe(1);
        done();
      });
  });

  it('should have a read method that accepts a object and extracts the id and calls fetch()', function(done){
    mockModel.read({
      id: 1
    })
    .then(function(result){
      expect(typeof result).toBe('object');
      expect(mockModelSettings.fetchCalled).toBe(1);
      expect(result.id).toBe(1);
      done();
    });
  });

  it('should have a read that accepts an array of ids and calls fetchAll()', function(done){
    mockModel.read([1])
    .then(function(result){
      expect(result instanceof Array).toBe(true);
      expect(mockModelSettings.fetchAllCalled).toBe(1);
      expect(result[0].id).toBe(1);
      done();
    });
  });

  it('should have a readAll method that calls fetchAll', function(done){
    mockModel.readAll()
    .then(function(result){
      expect(result instanceof Array).toBe(true);
      expect(mockModelSettings.fetchAllCalled).toBe(1);
      expect(result[0].id).toBe(1);
      done();
    });
  });

  it('should have a find method that calls fetch()', function(done){
    mockModel.find({
      id: 1
    })
      .then(function(result){
        expect(typeof result).toBe('object');
        expect(result.id).toBe(1);
        expect(mockModelSettings.fetchCalled).toBe(1);
        done();
      });
  });

  it('should have a update method that calls save() and  fetch()', function(done){
    mockModel.update({
      id: 1
    })
      .then(function(result){
        expect(typeof result).toBe('object');
        expect(result.id).toBe(1);
        expect(mockModelSettings.saveCalled).toBe(1);
        expect(mockModelSettings.fetchCalled).toBe(1);
        done();
      });
  });

  it('should have a updateAll method that saves an array of objects', function(done){
    mockModel.updateAll([{
      id: 1
    }])
      .then(function(result){
        expect(result instanceof Array).toBe(true);
        expect(mockModelSettings.saveCalled).toBe(1);
        expect(mockModelSettings.fetchCalled).toBe(1);
        done();
      });
  });

  it('should have a del method that calls destroy', function(done){
    mockModel.del(1)
      .then(function(){
        expect(mockModelSettings.destroyCalled).toBe(1);
        done();
      });
  });

  describe('convertTimestampsToUnix', function(){
    it('should convert fields to timestamps', function(){
      var now = new Date();
      var results = BookshelfModel.convertTimestampsToUnix()({
        id: 1,
        created_at: now
      });
      expect(results.created_at).toBe(now.getTime().toString());
    });

    it('should convert fields to timestamps in camelCase', function(){
      var now = new Date();
      var results = BookshelfModel.convertTimestampsToUnix(['createdAt'], { camelCase: true })({
        id: 1,
        created_at: now
      });
      expect(results.createdAt).toBe(now.getTime().toString());
    });
  });

  describe('convertDatesToISO8601', function(){
    it('should to convert fields to ISO8601', function(){
      var now = new Date();
      var results = BookshelfModel.convertDatesToISO8601()({
        id: 1,
        created_at: now
      });
      expect(results.created_at).toBe(moment(now).utc().format());
    });

    it('should to convert fields to ISO8601 in camelCase', function(){
      var now = new Date();
      var results = BookshelfModel.convertDatesToISO8601(['createdAt'], { camelCase: true })({
        id: 1,
        created_at: now
      });
      expect(results.createdAt).toBe(moment(now).utc().format());
    });
  });

});
