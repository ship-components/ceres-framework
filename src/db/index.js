/**
 * Connect to database connection
 * @param  {Object} config
 * @return {Promise}
 */
module.exports = function(config, Ceres) {
  if (config.db.type === 'bookshelf') {
    // Setup Bookself
    return require('./bookself')(config, Ceres);
  } else if (config.db.type === 'rethinkdb'){
    return require('./rethinkdb')(config, Ceres);
  } else {
    // Unknown config
    throw new Error('Unknown config.db.type');
  }
};
