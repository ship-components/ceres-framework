/*******************************************************************************
 * Base Model
 ******************************************************************************/

var _ = require('lodash');

/**
 * Create a model using bookself
 *
 * @param     {Object}    options
 * @return    {Object}
 */
function extend(options) {
  var db = require('../db.js')();

  /**
   * CRUD API
   */
  var Model = _.extend({

    /**
     * Store a copy of the options
     *
     * @type    {Object}
     */
    options: options,

    /**
     * Store a copy of the bookself model to handle relationship
     *
     * @type    {Bookself.model}
     */
    model: db.Model.extend(options.table),

    /**
     * Create model and return a promise
     *
     * @param     {Object}    body
     * @return    {Bluebird.promise}
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
     * @return    {Bluebird.promise}
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
     * Update/Patch a single model
     *
     * @param     {Object}    body
     * @return    {Bluebird.promise}
     */
    update: function(body) {
      var id = body.id;
      delete body.id; // Can't update the ID
      delete body.createdAt; // You can only create it once
      delete body.updatedAt; // Handled by DB

      return new this.model({
        id: id
      }).save(body, {
        patch: true,
        method: 'update'
      }).then(function(model){
        // Get relations
        return model.fetch(options.fetch);
      });
    },

    /**
     * Delete a model
     *
     * @param     {Number}    id
     * @return    {Bluebird.promise}
     */
    del: function(body) {
      return new this.model({
        id: body.id
      }).destroy();
    }
  }, options.methods);

  return _.bindAll(Model, 'read', 'create', 'update', 'del');
};

/**
 * Convert Dates to timestamps
 *
 * @param     {Array}    fields
 */
function convertTimestampsToUnix(fields) {
  fields = fields || ['created_at', 'updated_at'];

  /**
   * Bookshelf process function
   *
   * @param     {Array}    attrs
   */
  return function(attrs) {
    return _.reduce(attrs, function(memo, val, key) {
      if (val && fields.indexOf(key) > -1) {
        memo[_.camelCase(key)] = (new Date(val)).getTime();
      } else {
        memo[_.camelCase(key)] = val;
      }
      return memo;
    }, {});
  };
};

module.exports = function(config) {
  return {
    extend: extend,
    convertTimestampsToUnix: convertTimestampsToUnix
  }
}
