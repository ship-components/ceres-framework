/*******************************************************************************
 * Base Model
 ******************************************************************************/

var path = require('path');

/**
 * Required methods for all Models
 * @type {Object}
 */
Model.prototype = {
  /**
   * Create model and return a promise
   */
  create: null,

  /**
   * Read all models or just a single one
   */
  read: null,

  /**
   * Update/Patch a single model
   */
  update: null,

  /**
   * Delete a model
   */
  del: null
};

/**
 * Setup a consistent model system that interacts with an database
 * @param {Object} props
 */
function Model(props) {
  // Import ORM
  var model;

  if (['bookshelf', 'rethinkdb'].indexOf(props.type.toLowerCase()) > -1) {
    var orm = require(path.resolve(__dirname + '/models/' + props.type));
    model = orm.extend(props);
  } else {
    throw new Error('Unknown model type: ' + props.type);
  }

  // Override defaults
  Object.assign(this, model, props);

  // Ensure all required methods are defined
  for (var method in CRUD) {
    if (CRUD.hasOwnProperty(method) && typeof this[method] !== 'function') {
      throw new TypeError('Required Model method \'' + method + '\' is not a function');
    }
  }

  // Allow some user initialization code
  if (typeof this.init === 'function') {
    this.init.call(this);
  }
}

/**
 * Helper function to create new models. Ensures the correct interface for
 * default rest controller
 *
 * @param     {Object}    props
 * @return    {Object}
 */
Model.extend = function extend(props) {
  return new Model(props);
};

module.exports = Model;
