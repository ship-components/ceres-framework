/**
 * Connect to database connection
 * @param  {import('../Ceres')} ceres
 * @return {import('bluebird')}
 */
module.exports = ceres => {
  if (['bookshelf'].indexOf(ceres.config.db.type) > -1) {
    return require(`./${ceres.config.db.type}`)(ceres);
  }
  return undefined;
};
