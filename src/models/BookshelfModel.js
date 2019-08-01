/** *****************************************************************************
 * Base Model
 ***************************************************************************** */

const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const { assertNotNull } = require('../lib/assert');
const { assertDefined } = require('../lib/assert');
const { applySoftDeletes } = require('./lib/applySoftDeletes');
const { BaseModel } = require('./BaseModel');

/**
 * Ceres Bookshelf Model
 * @class
 * @augments {BaseModel}
 * @namespace Ceres.BookshelfModel
 */
class BookshelfModel extends BaseModel {
  /**
   * Convert string dates to timestamps
   * @param {string[]} [fields] The column names to convert
   * @param {{ camelCase?: boolean }} [options] Additional options
   */
  static convertTimestampsToUnix(fields, options) {
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
  }

  /**
   * Convert date columns to ISO8601
   * @param {string[]} [fields] The column names to convert
   * @param {{ camelCase?: boolean }} [options] Additional options
   */
  static convertDatesToISO8601(fields, options) {
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
  }

  /**
   * @typedef BookshelfTableOptions
   * @property {string} tableName The database table name
   * @property {string[] | boolean} hasTimestamps An array of the names of the timestamp fields
   */

  /**
   * Getter for fetch
   * @type { BookshelfTableOptions }
   */
  // eslint-disable-next-line class-methods-use-this
  get table() {
    // @ts-ignore
    return {};
  }

  /**
   * Getter for fetch
   * @type { import('bookshelf').FetchAllOptions | import('bookshelf').FetchOptions}
   */
  // eslint-disable-next-line class-methods-use-this
  get fetch() {
    return {};
  }

  /**
   * Ceres Bookshelf Model
   * @memberof Ceres
   * @param { import ("../Ceres")}  ceres
   * @param {{softDeletes?: boolean}} options
   */
  constructor(ceres, options = {}) {
    super(ceres);
    this.options = options;

    /**
     * Bookshelf Model
     * @type { import('bookshelf').Model  }
     */
    // @ts-ignore
    this.Model = this.database.Model.extend(this.table);

    if (this.options && this.options.softDeletes === true) {
      this.Model = applySoftDeletes.call(this.table, this.Model);
    }

    /**
     * @deprecated Switching to capitalized this.Model to fix the linting errors
     */
    this.model = this.Model;

    // Make these functions easier to get to
    this.raw = this.database.knex.raw;
    this.where = this.Model.where.bind(this.Model);
    this.query = this.Model.query.bind(this.Model);
  }

  /**
   * Create model and return a promise
   * @param {object} body
   * @return {promise}
   */
  create(body) {
    assertNotNull(this.Model);
    // @ts-ignore
    return new this.Model(body)
      .save(null, {
        method: 'insert',
      })
      .then(model => {
        // Look up any relations
        return this.read(model.id);
      });
  }

  /**
   * Read a single model
   * @param {string | number | {id: string | number }} id
   * @return {import('bluebird')}
   */
  read(id) {
    assertNotNull(this.Model);
    assertDefined(id, 'id');
    if (id instanceof Array) {
      return this.Model.where('id', 'IN', id).fetchAll(this.fetch);
    }
    if (_.isObject(id)) {
      // @ts-ignore
      return new this.Model({
        id: id.id,
      }).fetch(this.fetch);
    }
    // @ts-ignore
    return new this.Model({
      id,
    }).fetch(this.fetch);
  }

  /**
   * Read all models
   * @return {Promise}
   */
  readAll() {
    assertNotNull(this.Model);
    return this.Model.fetchAll(this.fetch);
  }

  /**
   * Perform a custom query
   * @param {Object} query
   * @return {Promise}
   */
  find(query) {
    assertNotNull(this.Model);
    // @ts-ignore
    return new this.Model(query).fetch(this.fetch);
  }

  /**
   * Update/Patch a single model
   *
   * @param     {Object}    body
   * @return    {promise}
   */
  update(body, id) {
    if (typeof id === 'undefined' && typeof body.id !== 'undefined') {
      ({ id } = body);
    }
    assertNotNull(this.Model);
    assertDefined(id, 'id');

    // Clone so we don't mutate accidently
    Object.assign({}, body);

    delete body.id; // Can't update the ID
    delete body.created_at; // You can only create it once
    delete body.updated_at; // Handled by DB

    // @ts-ignore
    return new this.Model({
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
  }

  /**
   * Update an array of objects
   * @param    {Array<Object>} body
   * @return   {Promise}
   */
  updateAll(body) {
    if (body instanceof Array !== true) {
      body = [body];
    }
    return Promise.all(
      body.map(doc => {
        return this.update(doc, doc.id);
      })
    );
  }

  /**
   * Delete a model
   *
   * @param     {Number}    id
   * @return    {promise}
   */
  del(id) {
    assertNotNull(this.Model);
    assertDefined(id, 'id');
    // @ts-ignore
    return new this.Model({
      id,
    }).destroy();
  }
}

module.exports.BookshelfModel = BookshelfModel;
