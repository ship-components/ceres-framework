/**
 * Connect to database connection
 * @param  {import('../../config/default')} config
 * @param  {import('../Ceres')} Ceres
 * @return {import('bluebird')}
 */
module.exports = (config, Ceres) => {
  if (['bookshelf'].indexOf(config.db.type) > -1) {
    return require(`./${config.db.type}`)(config, Ceres);
  }
  return undefined;
};
