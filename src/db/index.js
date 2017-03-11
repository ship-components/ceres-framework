/**
 * Connect to database connection
 * @param  {Object} config
 * @return {Promise}
 */
module.exports = function(config, Ceres) {
  if (config.db.type === 'bookshelf') {
    // Setup Bookself
    return require('./bookself')(config, Ceres);
  } else if (config.db.type === 'mongodb'){
    return require('./mongodb')(config, Ceres);
  } else if (config.db.type === 'rethinkdb'){
    return require('./rethinkdb')(config, Ceres);
  }
	return;
};
