const Promise = require('bluebird');

/**
 * Single reference
 * @type {[type]}
 */
let db = null;

module.exports = function bookshelf(config, ceres) {
  return new Promise(resolve => {
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
    // eslint-disable-next-line import/no-extraneous-dependencies
    db.knex = require('knex')({
      client: 'pg',
      connection: config.db,
      migrations: 'migrations',
    });

    /**
     * Setup Bookself ORM
     * @type    {Bookself}
     */
    // eslint-disable-next-line import/no-extraneous-dependencies
    db.bookshelf = require('bookshelf')(db.knex);

    // eslint-disable-next-line import/no-extraneous-dependencies
    const pg = require('pg');

    // convert bigint to number since we typically don't deal in actual bigints
    pg.types.setTypeParser(20, value => {
      return parseInt(value, 10);
    });

    // convert numeric to string since we don't need ultra percision
    pg.types.setTypeParser(1700, value => {
      return parseFloat(value);
    });

    // Check to see if we want to enable live queries
    if (config.db.liveDb) {
      // Only require this if we need it
      // eslint-disable-next-line import/no-extraneous-dependencies
      const LivePG = require('pg-live-select');

      /**
       * Connection string
       * @type {String}
       */
      const connection = `postgres://${config.db.user}:${config.db.password}@${config.db.host}/${config.db.database}`;

      ceres.log.internal.silly('Setting up livePG connection');

      // Setup live db connection using a unique channel for each instance
      db.liveDb = new LivePG(connection, `${config.db.database}_${process.env.CERES_UNIQUE_ID}`);

      // Clean up on exit
      process.on('exit', () => {
        if (db !== null && db.liveDb) {
          db.liveDb.cleanup(() => {
            ceres.log.internal.silly('liveDb cleaned up after exit');
          });
        }
      });
    }

    resolve(db);
  });
};
