/** *****************************************************************************
 * Base Model
 ***************************************************************************** */

const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const { assertNotNull } = require('../../lib/assert');
const { assertDefined } = require('../../lib/assert');

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

  // Make raw function from knex available directly on the model
  this.raw = this.database.knex.raw;
  // Make bookself methods available directly on our model so we don't have to
  // do `this.model.model[fn]` to access them.
  // eslint-disable-next-line no-restricted-syntax
  for (const fnName in this.model) {
    // eslint-disable-next-line no-prototype-builtins
    if (!this.model.hasOwnProperty(fnName)) {
      // eslint-disable-next-line no-continue
      continue;
    } else if (typeof this.model[fnName] === 'function' && typeof this[fnName] !== 'undefined') {
      // Ensure we don't override anything
      throw new Error(`bookshelf.${fnName} conflicts with local model`);
    } else if (typeof this.model[fnName] === 'function') {
      // Gotta bind to ensure the right this
      this[fnName] = this.model[fnName].bind(this.model);
    }
  }
}

/**
 * Create model and return a promise
 *
 * @param     {Object}    body
 * @return    {promise}
 */
BookshelfModel.prototype.create = function create(body) {
  assertNotNull(this.model);
  // eslint-disable-next-line new-cap
  return new this.model(body)
    .save(null, {
      method: 'insert',
    })
    .then(model => {
      // Look up any relations
      return this.read(model.id);
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
  if (id instanceof Array) {
    return this.model.where('id', 'IN', id).fetchAll(this.fetch);
  }
  if (_.isObject(id)) {
    // eslint-disable-next-line new-cap
    return new this.model({
      id: id.id,
    }).fetch(this.fetch);
  }
  // eslint-disable-next-line new-cap
  return new this.model({
    id,
  }).fetch(this.fetch);
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
  // eslint-disable-next-line new-cap
  return new this.model(query).fetch(this.fetch);
};

/**
 * Update/Patch a single model
 *
 * @param     {Object}    body
 * @return    {promise}
 */
BookshelfModel.prototype.update = function update(body, id) {
  if (typeof id === 'undefined' && typeof body.id !== 'undefined') {
    ({ id } = body);
  }
  assertNotNull(this.model);
  assertDefined(id, 'id');

  // Clone so we don't mutate accidentally
  body = { ...body };

  delete body.id; // Can't update the ID
  delete body.created_at; // You can only create it once
  delete body.updated_at; // Handled by DB

  // eslint-disable-next-line new-cap
  return new this.model({
    id,
  })
    .save(body, {
      patch: true,
      method: 'update',
    })
    .then(() => {
      // Get relations
      return this.read(id);
    });
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
  return Promise.all(
    body.map(doc => {
      return this.update(doc, doc.id);
    })
  );
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
  // eslint-disable-next-line new-cap
  return new this.model({
    id,
  }).destroy();
};

module.exports = BookshelfModel;

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
  return attrs => {
    return _.reduce(
      attrs,
      (memo, val, key) => {
        if (options.camelCase) {
          key = _.camelCase(key);
        }
        if (val && fields.indexOf(key) > -1) {
          memo[key] = moment(val).format('x');
        } else {
          memo[key] = val;
        }
        return memo;
      },
      {}
    );
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
  return attrs => {
    return _.reduce(
      attrs,
      (memo, val, key) => {
        if (options.camelCase) {
          key = _.camelCase(key);
        }
        if (val && fields.indexOf(key) > -1) {
          memo[key] = moment(val)
            .utc()
            .format();
        } else {
          memo[key] = val;
        }
        return memo;
      },
      {}
    );
  };
};
