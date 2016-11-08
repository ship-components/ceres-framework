/*******************************************************************************
 * Base Model
 ******************************************************************************/

var _ = require('lodash');

var BaseModel = require('../BaseModel');
var Promise = require('bluebird');

var Model = BaseModel.extend({
  /**
   * Store a copy of the bookself model to handle relationship
   *
   * @type    {Bookself.model}
   */
  model: null,

  /**
   * Create model and return a promise
   *
   * @param     {Object}    body
   * @return    {promise}
   */
  create: function(body) {
    return new Promise(function(resolve, reject){
      this.collection.insert(body, function(err, result){
        if(err) {
          reject(err);
        } else {
          resolve(result.ops[0]);
        }
      });
    }.bind(this));
  },

  /**
   * Read a single model
   *
   * @param     {Mixed}    id
   * @return    {promise}
   */
  read: function(id) {
    if (typeof id !== 'string') {
      return Promise.reject(new Error('id is not a string'));
    }
    return new Promise(function(resolve, reject){
      this.collection.findOne({
        _id: id
      }, function(err, result){
        if(err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    }.bind(this));
  },

  /**
   * Return all records in collection
   * @return {Promise}
   */
  readAll: function() {
    return new Promise(function(resolve, reject){
      this.collection.find({}, function(err, result){
        if (err) {
          reject(err);
        } else {
          resolve(result.toArray());
        }
      });
    }.bind(this));
  },

  /**
   * Do a custom query
   *
   * @param     {Mixed}    id
   * @return    {promise}
   */
  find: function(query) {
    if (typeof query !== 'object') {
      return Promise.reject(new Error('query is not an object'));
    }
    return new Promise(function(resolve, reject){
      this.collection.find(query, function(err, result){
        if(err) {
          reject(err);
        } else {
          resolve(result.toArray());
        }
      });
    }.bind(this));
  },

  /**
   * Update/Patch a single model
   *
   * @param     {Object}    body
   * @return    {promise}
   */
  update: function(body, id) {
    if (!id) {
      id = body._id;
    }
    delete body._id; // Can't update the ID
    return new Promise(function(resolve, reject){
      this.collection.updateOne({
        _id: id
      }, body, function(err, result){
        if(err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    }.bind(this));
  },

  /**
   * Delete a model
   *
   * @param     {Number}    id
   * @return    {promise}
   */
  del: function(id) {
    return new Promise(function(resolve, reject){
      this.collection.remove({
        _id: id
      }, function(err, result){
        if(err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    }.bind(this));
  }
});

/**
 * Helper function to create new models
 * @param     {Object}    props
 * @return    {Object}
 */
module.exports.extend = function extend(props) {
  // Override defaults
  var model = _.merge({}, this.Database, Model, props);

  // Ensure correct this context
  for (var key in model) {
    if (model.hasOwnProperty(key) && typeof model[key] === 'function') {
       model[key] = model[key].bind(model);
    }
  }

  model.collection = this.Database.collection(props.table.tableName);

  return model;
};
