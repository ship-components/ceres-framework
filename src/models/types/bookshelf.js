/*******************************************************************************
 * Base Model
 ******************************************************************************/

var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var assertNotNull = require('../../lib/assert').assertNotNull;
var assertDefined = require('../../lib/assert').assertDefined;

/**
 * Setup
 * @param    {Object}    props
 */
function BookshelfModel(props) {
	// Override defaults
  Object.assign(this, props);

	// Ensure correct this context
  _.bindAll(this);

	// Setup bookself
	this.model = this.database.Model.extend(this.table);
}

/**
 * Create model and return a promise
 *
 * @param     {Object}    body
 * @return    {promise}
 */
BookshelfModel.prototype.create = function create(body) {
  assertNotNull(this.model);
  return new this.model(body).save(null, { // eslint-disable-line new-cap
    method: 'insert'
  });
};

  /**
   * Read a single model
   *
   * @param     {Mixed}    id
   * @return    {promise}
   */
BookshelfModel.prototype.read = function read(id) {
  assertNotNull(this.model);
  assertDefined(id, 'id');
  if (_.isObject(id)) {
    return new this.model({ // eslint-disable-line new-cap
      id: id.id
    }).fetch(this.fetch);
  } else {
    return new this.model({ // eslint-disable-line new-cap
      id: id
    }).fetch(this.fetch);
  }
};

/**
 * Read all models
 * @return {Promise}
 */
BookshelfModel.prototype.readAll = function readAll() {
  assertNotNull(this.model);
  return this.model.fetchAll(this.fetch);
};

/**
 * Perform a custom query
 *
 * @param     {Object}    query
 * @return    {Promise}
 */
BookshelfModel.prototype.find = function find(query) {
  assertNotNull(this.model);
  return new this.model(query).fetch(this.fetch); // eslint-disable-line new-cap
};

/**
 * Perform a query with the knex query builder
 */
BookshelfModel.prototype.query = function query(queryBuilder) {
  assertNotNull(this.model);
  return this.model.query(queryBuilder).fetchAll(this.fetch);
};

/**
 * Update/Patch a single model
 *
 * @param     {Object}    body
 * @return    {promise}
 */
BookshelfModel.prototype.update = function update(body, id) {
  if (typeof id === 'undefined' && typeof body.id !== 'undefined') {
    id = body.id;
  }
  assertNotNull(this.model);
  assertDefined(id, 'id');

  // Clone so we don't mutate accidently
  Object.assign({}, body);

  delete body.id; // Can't update the ID
  delete body.created_at; // You can only create it once
  delete body.updated_at; // Handled by DB

  return new this.model({ // eslint-disable-line new-cap
    id: id
  }).save(body, {
    patch: true,
    method: 'update'
  }).then(function(model) {
    // Get relations
    return model.fetch(this.fetch);
  }.bind(this));
};

/**
 * Update an array of objects
 * @param    {Array<Object}    body
 * @return   {Promise}
 */
BookshelfModel.prototype.updateAll = function updateAll(body) {
  if (body instanceof Array !== true) {
    body = [body];
  }
  return Promise.all(body.map(function(doc) {
    return this.update(doc, doc.id);
  }.bind(this)));
};

/**
 * Delete a model
 *
 * @param     {Number}    id
 * @return    {promise}
 */
BookshelfModel.prototype.del = function del(id) {
  assertNotNull(this.model);
  assertDefined(id, 'id');
  return new this.model({ // eslint-disable-line new-cap
    id: id
  }).destroy();
};

/**
 * Helper function to create new models
 * @param     {Object}    props
 * @return    {Object}
 */
module.exports.extend = function extend(props) {
	props.database = props.database || this.Database.bookshelf;
  return new BookshelfModel(props);
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
        memo[key] = moment(val).format('x');
      } else {
        memo[key] = val;
      }
      return memo;
    }, {});
  };
};

/**
 * Convert dates to ISO8601
 *
 * @param     {Array}    fields
 */
module.exports.convertDatesToISO8601 = function convertDatesToISO8601(fields, options) {
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
        memo[key] = moment(val).utc().format();
      } else {
        memo[key] = val;
      }
      return memo;
    }, {});
  };
};
