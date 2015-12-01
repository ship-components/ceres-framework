/*******************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Framework constructor
 ******************************************************************************/

var path = require('path');
var _ = require('lodash');

var Setup = require('./setup');
var Controller = require(path.resolve(__dirname + '/rest/Controller'));
var Model = require(path.resolve(__dirname + '/rest/Model'));
var Pipeline = require(path.resolve(__dirname + '/render/Pipeline'));

function Ceres() {
  this.startTime = process.hrtime();

  this.config = {};

  /**
   * Base Rest Controller API
   *
   * @type {Object}
   */
  this.Rest = {

    /**
     * Base Controller
     *
     * @type {Object}
     */
    Controller: Controller,

    /**
     * Base Model
     *
     * @type {Object}
     */
    Model: Model,

  };

  /**
   * Render Pipline
   *
   * @type {Object}
   */
  this.Pipeline = Pipeline;
}

Ceres.prototype.load = function(options, done) {
  // Bootstrap config
  this.config = Setup.config(options);

  if (this.config.folders.middleware) {
    this.config.middleware = Setup.directory(this.config.folders.middleware, {
      config: this.config
    });
  }

  this.Database = require(__dirname + '/db')(this.config);

  // Bind the correct context
  this.Pipeline.create = this.Pipeline.create.bind(this);
  this.Rest.Controller.extend = this.Rest.Controller.extend.bind(this);
  this.Rest.Model.extend = this.Rest.Model.extend.bind(this);

  if (typeof done === 'function') {
    done(this);
    return;
  }

  return {
    /**
     * For semantics
     * @param  {Function} callback
     */
    then: function(callback) {
      callback = callback || function() {};

      callback(this);
    }.bind(this)
  }
}

module.exports = Ceres
