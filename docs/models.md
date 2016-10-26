# Models
Models are saved in the `server/models` folder and can be required anywhere

## CLI
This commands create an empty controller for you if you have the CLI installed

```
ceres model ExampleModel
```

## Config
Default database config is found in the config folder. Default ORM is [bookself.js](bookshelfjs.org).

```
  db: {
    type     : 'bookshelf',
    host     : '127.0.0.1',
    user     : '',
    password : '',
    database : '',
    charset  : 'utf8'
  },
```

## Basic Example

```
/** ****************************************************************************
 * UserModel
 ******************************************************************************/

var Ceres = require('ceres-framework');

module.exports = new Ceres.Model({

  /**
   * Table settings
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
  }
});
```
