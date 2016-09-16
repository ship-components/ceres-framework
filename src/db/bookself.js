var Promise = require('bluebird');

/**
 * Single reference
 * @type {[type]}
 */
var db = null;

module.exports = function(config, Ceres) {
  return new Promise(function(resolve){
    if (db !== null) {
      resolve(db);
      return;
    }

    // Initialize as object
    db = {};

    /**
     * Setup Knex (DB Connection)
     *
     * @type    {Knex}
     */
    db.knex = require('knex')({
      client: 'pg',
      connection: config.db,
      migrations: 'migrations'
    });

    /**
     * Setup Bookself ORM
     * @type    {Bookself}
     */
    db.bookshelf = require('bookshelf')(db.knex);

    // Check to see if we want to enable live queries
    if (config.db.liveDb) {
      // Only require this if we need it
      var LivePG = require('pg-live-select');

      /**
       * Connection string
       * @type {String}
       */
      var connection = 'postgres://'+ config.db.user + ':' + config.db.password + '@' + config.db.host + '/' + config.db.database;

      Ceres.log._ceres.silly('Setting up livePG connection');

      // Setup live db connection
      db.liveDb = new LivePG(connection, config.db.database);
    }

    resolve(db);
  });

  // Clean up on exit
  process.on('exit', function() {
    if (db !== null && db.liveDb) {
      db.liveDb.cleanup(function(type){
        Ceres.log._ceres.silly('liveDb cleaned up after exit');
      });
    }
  });

};
