const Promise = require('bluebird');

module.exports = config => {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const { MongoClient } = require('mongodb');

      const url = `mongodb://localhost:27017/${config.db.database}`;

      MongoClient.connect(url, (err, db) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(db);
      });
    } catch (err) {
      reject(err);
    }
  });
};
