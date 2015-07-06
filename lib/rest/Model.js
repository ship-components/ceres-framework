/*******************************************************************************
 * Base Model
 ******************************************************************************/

var _ = require('lodash');
var BaseModel = require('./BaseModel');

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
    return new this.model(body).save(null, {
      method: 'insert'
    });
  },

  /**
   * Read all models or just a single one
   *
   * @param     {Mixed}    id
   * @return    {promise}
   */
  read: function(id) {
    if (_.isUndefined(id)) {
      return this.model.fetchAll(options.fetch);
    } else if (_.isObject(id)) {
      return new this.model({
        id: id.id
      }).fetch(options.fetch);
    } else {
      return new this.model({
        id: id
      }).fetch(options.fetch);
    }
  },

  /**
   * Perform a custom query
   *
   * @param     {Object}    query
   * @return    {Promise}
   */
  find: function(query) {
    return new this.model(query).fetch(options.fetch);
  },

  /**
   * Perform a query with the knex query builder
   */
  query: function(queryBuilder) {
    return this.model.query(queryBuilder).fetchAll(options.fetch);
  },

  /**
   * Update/Patch a single model
   *
   * @param     {Object}    body
   * @return    {promise}
   */
  update: function(body) {
    var id = body.id;
    delete body.id; // Can't update the ID

    delete body.created_at; // You can only create it once
    delete body.updated_at; // Handled by DB

    return new this.model({
      id: id
    }).save(body, {
      patch: true,
      method: 'update'
    }).then(function(model) {
      // Get relations
      return model.fetch(options.fetch);
    });
  },

  /**
   * Delete a model
   *
   * @param     {Number}    id
   * @return    {promise}
   */
  del: function(body) {
    return new this.model({
      id: body.id
    }).destroy();
  }
});

/**
 * Helper function to create new models
 * @param     {Object}    props
 * @return    {Object}
 */
module.exports.extend = function extend(props) {
  // Override defaults
  var model = _.merge({}, Model, props);

  return _.bindAll(model);
};

/**
 * Convert Dates to timestamps
 *
 * @param     {Array}    fields
 */
module.exports.convertTimestampsToUnix = function convertTimestampsToUnix(fields, options) {
  options = options || {};
  fields = fields || ['created_at', 'updated_at'];

  /**
   * Bookshelf process function
   *
   * @param     {Array}    attrs
   */
  return function(attrs) {
    return _.reduce(attrs, function(memo, val, key) {
      if (options.camelCase) {
        key = _.camelCase(key);
      }
      if (val && fields.indexOf(key) > -1) {
        memo[key] = (new Date(val)).getTime();
      } else {
        memo[key] = val;
      }
      return memo;
    }, {});
  };
};
