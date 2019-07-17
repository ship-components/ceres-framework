const Promise = require('bluebird');

module.exports = config => {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const r = require('rethinkdb');
      // eslint-disable-next-line import/no-extraneous-dependencies
      const { version } = require('rethinkdb/package.json');

      r.connect(config.db)
        .then(connection => {
          resolve({
            r,
            version,
            connection,
          });
        })
        .catch(err => {
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
};
