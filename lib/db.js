/**
 * Reference to DB
 */
var knex;

/**
 * Reference to models
 */
var bookshelf;

module.exports = function(config) {
  if (bookshelf) {
    return bookshelf;
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

  /**
   * Setup Bookself ORM
   * @type    {Bookself}
   */
  bookshelf = require('bookshelf')(knex);

  return bookshelf;
};
