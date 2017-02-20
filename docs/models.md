# Models
Models are saved in the `server/models` folder and can be required anywhere. By
default each model has `create`, `read`, 'update', 'delete' methods already
setup. Each can be overridden though.

## CLI
This commands create an empty controller for you if you have the CLI installed

```shell
ceres model ExampleModel
```

## Config
Default database config is found in the config folder. Default ORM is [bookself.js](bookshelfjs.org).

```js
  db: {
    type     : 'bookshelf',
    host     : '127.0.0.1',
    user     : '',
    password : '',
    database : '',
    charset  : 'utf8'
  },
```

## Default Bookshelf Methods
The follow methods are provided by default when using bookshelf.
```js
/**
 * Reads a single record
 * @param		{Number}	id
 * @returns {Promise}
 */
Model.read(id);

/**
 * Reads all records
 * @returns {Promise}
 */
Model.readAll()

/**
 * Creates a new record
 * @param		{Object}	body
 * @returns {Promise}
 */
Model.create(body)

/**
 * Updates a record. Either get the id from the body or the second argument
 * @param		{Object}	body
 * @param   {Number}  id     (optional)
* @returns {Promise}
 */
Model.update(body)

/**
 * Updates multiple records at once
 * @param		{Array<Object>}	bodies
 * @returns {Promise}
 */
Model.updateAll(bodies)

/**
 * Delete a record. Grabs the id from the body
 * @param		{Object}	body
 * @returns {Promise}
 */
Model.del(body)

/**
 * Search for a single record matching the query object
 * @param		{Object}	query
 * @returns {Promise}
 */
Model.find(object)

/**
 * Search for multiple records uses knex's QueryBuilder
 * @param		{QueryBuilder}	query
 * @returns {Promise}
 */
Model.query(gb)
```

## Basic Example

```js
/** ****************************************************************************
 * UserModel
 ******************************************************************************/

var Ceres = require('ceres-framework');

var UserModel = new Ceres.Model({
	/**
	 * Optional type to let you overview the app settings
	 * @type    {String}
	 */
	type: 'bookself',

  /**
   * Bookself Table settings
   *
   * @type    {Object}
   */
  table: {
    /**
     * Table Name
     *
     * @type    {String}
     */
    tableName: 'users',

    /**
     * You can specify relations. See bookself documentation for more examples
     * @return {[type]} [description]
     */
    groups: function() {
      return this.belongsToMany(require('./GroupModel').model, 'users_groups');
    }
  },

  /**
   * Fetch options, ie withRelations, there are the default relations to Load
   * when you do a Model.read. They are defined above in the table options
   *
   * @type    {Object}
   */
  fetch: {
    // You can also do include nested relations
    withRelated: ['groups', 'groups.project']
  },

	/**
	 * Override the default method
	 * @return    {Promise}
	 */
	read: function() {
		return this.database.knex.raw('SELECT * FROM users')
			.then(function(result){
				return result.rows
			});
	},

	/**
	 * You can create your own methods as we well.
	 * @param    {Number}    userId    User.id
	 * @return   {Promise}
	 */
	customMethod: function(userId) {
		return this.database.knex.raw('SELECT * FROM users WHERE users.id = ?', [userId])
			.then(function(result){
				return result.rows[0]
			});
	}
});

/**
 * Example of what it might be like to use in a controller
 * @param    {Request}    req
 * @param    {Response}   res
 * @return   {Undefined}
 */
function getAllUsersRequest(req, res) {
	return UserModel.readAll()
		.then(function(users){
			res.json(users);
		})
		.catch(function(err){
			res.status(500).json({
				message: err.message
			});
		})
}

module.exports = UserModel;
```
