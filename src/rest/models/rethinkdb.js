/*******************************************************************************
 * Base Model
 ******************************************************************************/

var _ = require('lodash');
var moment = require('moment');

var BaseModel = require('../BaseModel');

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
    return this.table()
      .insert(body)
      .run(this.connection)
  },

  /**
   * Read all models or just a single one
   *
   * @param     {Mixed}    id
   * @return    {promise}
   */
  read: function(id) {
    if (typeof id !== 'undefined') {
      return this.table()
        .get(id)
        .run(this.connection);
    } else {
      return this.table()
        .run(this.connection)
        .then(function(cursor){
          return cursor.toArray()
        });
    }
  },

  /**
   * Perform a custom query
   *
   * @param     {Object}    query
   * @return    {Promise}
   */
  filter: function(query) {
    return this.table()
      .filter(query)
      .run(this.connection)
      .then(function(cursor){
        return cursor.toArray()
      });
  },

  /**
   * Update/Patch a single model
   *
   * @param     {Object}    body
   * @return    {promise}
   */
  update: function(body, id) {
    delete body.id; // Can't update the ID
    delete body.created_at; // You can only create it once
    delete body.updated_at; // Handled by DB

    return this.table()
        .get(id)
        .update(body)
        .run(this.connection);
  },

  /**
   * Delete a model
   *
   * @param     {Number}    id
   * @return    {promise}
   */
  del: function(id) {
    return this.table()
      .get(id)
      .delete()
      .run(this.connection);
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

  model.table = this.Database.r.table.bind(this.Database.r, props.table.tableName);

  return model;
};
