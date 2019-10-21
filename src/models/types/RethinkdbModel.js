/** *****************************************************************************
 * Base Model
 ***************************************************************************** */

const _ = require('lodash');

/**
 * Init
 * @param    {Object}    props
 */
function RethinkdbModel(props) {
  Object.assign(this, props);

  // Ensure the right context
  _.bindAll(this);

  // Setup r
  this.table = this.Database.r.table.bind(this.Database.r, this.table.tableName);
}

Object.assign(RethinkdbModel.prototype, {
  /**
   * Create model and return a promise
   *
   * @param     {Object}    body
   * @return    {promise}
   */
  create(body) {
    return this.table()
      .insert(body)
      .run(this.connection);
  },

  /**
   * Read all models or just a single one
   *
   * @param     {Mixed}    id
   * @return    {promise}
   */
  read(id) {
    return this.table()
      .get(id)
      .run(this.connection);
  },

  /**
   * Read all models
   *
   * @param     {Mixed}    id
   * @return    {promise}
   */
  readAll() {
    return this.table()
      .run(this.connection)
      .then(cursor => {
        return cursor.toArray();
      });
  },

  /**
   * Perform a custom query
   *
   * @param     {Object}    query
   * @return    {Promise}
   */
  filter(query) {
    return this.table()
      .filter(query)
      .run(this.connection)
      .then(cursor => {
        return cursor.toArray();
      });
  },

  /**
   * Update/Patch a single model
   *
   * @param     {Object}    body
   * @return    {promise}
   */
  update(body, id) {
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
  del(id) {
    return this.table()
      .get(id)
      .delete()
      .run(this.connection);
  },
});

/**
 * Helper function to create new models
 * @param     {Object}    props
 * @return    {Object}
 */
module.exports.extend = function extend(props) {
  props.Database = props.Database || this.Database;
  return new RethinkdbModel(props);
};
