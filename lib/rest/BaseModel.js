/*******************************************************************************
 * Base Model
 ******************************************************************************/

var _ = require('lodash');

/**
 * Required methods for all Models
 *
 * @type {Object}
 */
var BaseModel = module.exports.BaseModel = {
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
module.exports.extend = function extend(props) {
  // Override defaults
  var model = _.merge({}, BaseModel, props);

  // Ensure all required methods are defined
  for(var method in BaseModel) {
    if(model.hasOwnProperty(method) && !_.isFunction(model[method])) {
      throw new TypeError('Required BaseModel method \'' + method + '\' is not a function');
    }
  }

  return model;
};
