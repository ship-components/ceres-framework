/*******************************************************************************
 * Controller - Base Controller
 ******************************************************************************/

var _ = require('lodash');
var EventEmitter = require('events');

/**
 * Default Controller Reponses
 *
 * @type    {Object}
 */
var Responses = require('./Responses');

/**
 * Clone and Bind context to each object value
 *
 * @param     {Object}    obj
 * @param     {Mixed}    ctx
 * @return    {Object}
 */
function bindEach(src, ctx) {
  var obj = {};
  for (var key in src) {
    if (src.hasOwnProperty(key)) {
      obj[key] = src[key].bind(ctx);
    }
  }
  return obj;
}

/**
 * Wrap the logic and provide a new this context
 *
 * @param     {Function}    handler
 * @param     {Object}      ctx         `this` from created Controller
 * @return    {Express.route}
 */
function wrapRoute(handler, ctx, config) {
  return function(req, res) {

    /**
     * Get all the models
     *
     * @type    {Object}
     */
    var models = req.app.get('models');

    /**
     * Grab the model from the express instance
     *
     * @type    {Object}
     */
    var model = ctx.model;

    /**
     * User overridden responses
     *
     * @type    {ject}
     */
    var responses = _.extend(Responses, ctx.responses);

    /**
     * Bind req and res to each response
     */
    responses = bindEach(responses, {
      req: req,
      res: res,
      controller: ctx,
      config: config
    });

    /**
     * Create this context
     *
     * @type    {Object}
     */
    var context = _.extend({
      controller: ctx
    }, responses, {
      model: model,
      models: models,
    });

    try {
      return handler.call(context, req, res);
    } catch(err) {
      return responses.fail(err);
    }
  };
};

/**
 * Base instance of a controller to be extended
 * @param {Object} props
 */
function Controller(props) {
  Object.assign(this, props);

  this._events = new EventEmitter();
  this.on = this._events.on;
  this.removeListener = this._events.removeListener;
  this.emit = this._events.emit;
}

/**
 * Make wrap wrapRoute public
 * @static
 * @type {Function}
 */
Controller.wrapRoute = wrapRoute;

/**
 * Helper function to create new controllers
 * @param     {Object}    props
 * @alias
 * @static
 * @return    {Controller}
 */
Controller.extend = function(props) {
  return new Controller(props);
};

/**
 * Export
 * @type {Function}
 */
module.exports = Controller;

/**
 * Prototype
 *
 * @type    {Object}
 */
Controller.prototype  = {

  /**
   * Shortcut to model for CRUD controllers
   * @type {[type]}
   */
  model: null,

  /**
   * Responses
   *
   * @type    {Object}
   */
  responses: _.clone(Responses),

  /**
   * Default Routes
   *
   * @type    {Object}
   */
  routes: {},

  /**
   * GET all
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  getAll: function() {
    this.model
      .read()
      .then(this.send)
      .catch(this.fail);
  },

  /**
   * GET One
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  getOne: function(req) {
    var id = parseInt(req.params.id, 10);

    // Ensure we have a valid id and don't accidently return everything
    if (isNaN(id)) {
      this.notFound('Unknown or invalid id');
      return;
    }

    this.model
      .read(req.params.id)
      .then(this.send)
      .catch(this.fail);
  },

  /**
   * POST - Create a record
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  postCreate: function(req) {
    this.model.create(req.body)
      .then(function(result){
        this.controller.emit('created', req, req.body, result);
        return result;
      }.bind(this))
      .then(this.send)
      .catch(this.fail);
  },

  /**
   * PUT - Update a record
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  putUpdate: function(req) {
    if (req.params.id) {
      // Update single
      this.model.update(req.body, req.params.id)
        .then(function(result){
          this.controller.emit('updated', req, req.body, result);
          return result;
        }.bind(this))
        .then(this.send)
        .catch(this.fail);
    } else {
      // Update multiple
      this.model.updateAll(req.body)
        .then(function(result){
          this.controller.emit('updated', req, req.body, result);
          return result;
        }.bind(this))
        .then(this.send)
        .catch(this.fail);
    }
  },

  /**
   * DELETE - Delete a record
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  deleteOne: function(req) {
    this.model.del(req.params.id)
      .then(function(result){
        this.controller.emit('deleted', req, req.params.id);
        return result;
      }.bind(this))
      .then(this.noContent)
      .catch(this.fail);
  },

  /**
   * Create a Express Router and overrde any defaults
   *
   * @return    {Express.router}
   */
  router: function(ceres, config, controllerName) {
    /**
     * Express Router
     *
     * @type    {Express.Router}
     */
    var router = require('express').Router();

    // Loop through all of them
    for (var route in this.routes) {
      if (this.routes.hasOwnProperty(route)) {
        // try {
        // Parse
        var parts = route.split(' ');
        var method = parts[0].toLowerCase();
        var path = parts[1];

        // Get fn name aka value
        var fnName = '';
        if (typeof this.routes[route] === 'string') {
          // Default
          fnName = this.routes[route];
        } else if (this.routes[route] instanceof Array) {
          // Array option so users can inject middleware
          fnName = this.routes[route].pop();
        }

        // Gett actual fn
        var handler;
        if (typeof fnName === 'string') {
          // By default look for a method with the fnName on `this`
          handler = this[fnName];
        } else if (typeof fnName === 'function') {
          // Allow user to pass in fn instead of string
          handler = fnName;
          fnName = handler.constructor.name;
        }

        if (typeof handler !== 'function') {
          ceres.log._ceres.warn('%s - Ignoring %s %s: %s is not a function', controllerName, method, path, fnName || 'undefined');
          // Skip if we're not a function
          continue;
        }

        // Path
        var args = [path];

        // Middleware
        if (_.isArray(this.middleware)) {
          args = args.concat(this.middleware);
        } else if (_.isFunction(this.middleware)) {
          var userMiddleware = this.middleware.call(this, config.middleware, config);
          if (!_.isArray(userMiddleware)) {
            userMiddleware = [userMiddleware];
          }
          args = args.concat(userMiddleware);
        }

        // Attach another other user supplied middleware
        if (this.routes[route] instanceof Array) {
          args = args.concat(this.routes[route]);
        }

        // Wrap and inject model
        var fn = wrapRoute(handler, this, config);

        // Add to args
        args.push(fn);

        if (typeof router[method] !== 'function') {
          ceres.log._ceres.warn('%s - Ignoring %s %s: router.%s is not a function', controllerName, method, path, method);
          continue;
        }

        // Express route
        router[method].apply(router, args);
        ceres.log._ceres.silly('%s - Setting up %s %s - %s', controllerName, method, path, fnName);
      }
    }

    return router;
  }
};
