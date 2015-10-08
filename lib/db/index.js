/**
 * Reference to DB Object
 */
var db = null;

module.exports = function(config) {
  if (db !== null) {
    // Already Setup
    return db;
  } else if (config.db.type === 'bookshelf') {
    // Setup Bookself
    return require('./bookself')(config);
  } else {
    // Unknown config
    return null;
  }
};
