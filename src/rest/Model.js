/*******************************************************************************
 * Base Model
 ******************************************************************************/

var path = require('path');

/**
 * Setup a consistent model system that interacts with an database
 * @param {Object} props
 */
function Model(Ceres, props) {
  // Import ORM
  var model;

  var type = props.type || Ceres.config.db.type;

  if (['bookshelf', 'rethinkdb'].indexOf(type.toLowerCase()) > -1) {
    var orm = require(path.resolve(__dirname + '/models/' + type));
    model = orm.extend.call(Ceres, props);
  } else {
    throw new Error('Unknown model type: ' + type);
  }

  // Override defaults
  Object.assign(this, model, props);

  // Allow some user initialization code
  if (typeof this.init === 'function') {
    this.init.call(this);
  }
}

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
