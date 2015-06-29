/*******************************************************************************
 * Base Model
 ******************************************************************************/

var _ = require('lodash');

/**
 * Expose API
 *
 * @param     {Obejct}    config
 * @return    {Object}
 */
module.exports = function(config) {

  /**
   * Setup DB
   *
   * @type    {Bookself}
   */
  var bookself = require('../db.js')(config);

  /**
   * Create a model using bookself
   *
   * @param     {Object}    options
   * @return    {Object}
   */
  function extend(options) {
    /**
     * CRUD API
     */
    var Model = {

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
      model: bookself.Model.extend(options.table),

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
        }).then(function(model){
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
    };

    // Bind user methods so they have the right context
    if(_.isObject(options.methods)) {
      for(var key in options.methods) {
        if(options.methods.hasOwnProperty(key)) {
          options.methods[key] = options.methods[key].bind(Model);
        }
      }
      Model = _.extend(Model, options.methods);
    }

    return _.bindAll(Model, 'read', 'create', 'find', 'update', 'del');
  }

  /**
   * Convert Dates to timestamps
   *
   * @param     {Array}    fields
   */
  function convertTimestampsToUnix(fields, options) {
    options = options || {};
    fields = fields || ['created_at', 'updated_at'];

    /**
     * Bookshelf process function
     *
     * @param     {Array}    attrs
     */
    return function(attrs) {
      return _.reduce(attrs, function(memo, val, key) {
        if(options.camelCase) {
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
  }

  return {
    extend: extend,
    convertTimestampsToUnix: convertTimestampsToUnix
  };
};
