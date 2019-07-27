/**
 * Default Options
 */
const defaultOptions = {
  fieldName: 'deleted_at',
};

/**
 * Enables soft deletes on a Ceres BookshelfModel. Drop in
 * replacement for Ceres.Model
 * @param { import('bookshelf').Model } model
 * @param {Object} options
 */
module.exports.applySoftDeletes = function applySoftDeletes(model, options = defaultOptions) {
  const config = Object.assign({}, defaultOptions, options);

  /**
   * Save copies of the original functions so we can call them later
   */
  const originalModel = {
    fetch: model.prototype.fetch,
    fetchAll: model.prototype.fetchAll,
    sync: model.prototype.sync,
  };

  // Require deleted_at to always be null when fetching
  model.prototype.fetch = function fetch(...args) {
    this.query('whereNull', `${this.tableName}.${config.fieldName}`);
    return originalModel.fetch.apply(this, args);
  };

  // Require deleted_at to be null when fetching
  model.prototype.fetchAll = function fetchAll(...args) {
    this.query('whereNull', `${this.tableName}.${config.fieldName}`);
    return originalModel.fetchAll.apply(this, args);
  };

  // Override sync so we which handles deletes
  model.prototype.sync = function sync(...args) {
    const syncResult = originalModel.sync.apply(this, args);

    // Override the delete method so we don't actually delete and instead
    // set the date at which it was deleted
    syncResult.del = function del() {
      return syncResult.update.call(syncResult, { [config.fieldName]: new Date() });
    };

    return syncResult;
  };

  return model;
};
