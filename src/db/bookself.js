var Promise = require('promise');
var LivePG = require('pg-live-select');

/**
 * Reference to DB
 */
var knex;

var db = null;

module.exports = function(config, Ceres) {
  return new Promise(function(resolve){
    if (db !== null) {
      resolve(db);
      return;
    }

    /**
     * Setup Knex (DB Connection)
     *
     * @type    {Knex}
     */
    knex = require('knex')({
      client: 'pg',
      connection: config.db,
      migrations: 'migrations'
    });

    // Initialize as object
    db = {};

    /**
     * Setup Bookself ORM
     * @type    {Bookself}
     */
    db.bookshelf = require('bookshelf')(knex);

    /**
     * Connection string
     * @type {String}
     */
    var connection = 'postgres://'+ config.db.user + ':' + config.db.password + '@' + config.db.host + '/' + config.db.database;

    Ceres.log._ceres.silly('Setting up livePG connection');

    // Setup live db connection
    db.liveDb = new LivePG(connection, config.db.database);

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
