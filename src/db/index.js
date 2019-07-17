/**
 * Connect to database connection
 * @param  {Object} config
 * @return {Promise}
 */
module.exports = function(config, Ceres) {
  if (['bookshelf', 'mongodb', 'rethinkdb'].indexOf(config.db.type) > -1) {
    return require(`./${config.db.type}`)(config, Ceres);
  }
};
