var Promise = require('bluebird');

module.exports = function(config) {
  return new Promise(function(resolve, reject){
    try {
      var MongoClient = require('mongodb').MongoClient;

      var url = 'mongodb://localhost:27017/' + config.db.database;

      MongoClient.connect(url, function(err, db){
        if(err) {
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
