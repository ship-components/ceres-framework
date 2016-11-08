/*******************************************************************************
 * Controller - Base Controller
 ******************************************************************************/

var EventEmitter = require('events');

/**
 * Default Controller Reponses
 *
 * @type    {Object}
 */
var Responses = require('../lib/Responses');

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
 * Get the full path of a controller endpoint
 * @param  {Object} controlle
 * @param  {String} path
 * @return {String}
 */
function getFullPath(controller, path) {
  return (controller.endpoint + path).replace('//','/');
}

/**
 * Wrap the logic and provide a new this context
 *
 * @param     {Function}    handler
 * @param     {Object}      ctx         `this` from created Controller
 * @return    {Express.route}
 */
function wrapRoute(handler, ctx, ceres) {
  return function(req, res) {
    /**
     * Create this context
     *
     * @type    {Object}
     */
    var context = Object.assign({
      /**
       * Make req available on this
       * @type {Express.Request}
       */
      req: req,

      /**
       * Make res available on this
       * @type {Express.Responses}
       */
      res: res,

      /**
       * Ceres config
       * @type {Object}
       */
      config: ceres.config,

      /**
       * Make the loggere availabe to each request
       * @type {Winston}
       */
      log: ceres.log,

      /**
       * Old way of accessing context
       * @deprecated
       * @type {Object}
       */
      controller: ctx,

      /**
       * All models
       * @type {Object}
       */
      models: req.app.get('models')

    }, ctx);

    /**
     * User overridden responses
     * @type    {Oject}
     */
    var responses = Object.assign({}, Responses, ctx.responses);

    /**
     * Bind req and res to each response
     */
    responses = bindEach(responses, context);

    // Attach to context
    Object.assign(context, responses);

    // Attempt to catch any errors and handle them gracefully
    try {
      return handler.call(context, req, res, ceres);
    } catch(err) {
      return context.fail(err);
    }
  };
}

/**
 * Base instance of a controller to be extended
 * @param {Object} props
 */
function Controller(Ceres, props) {
  Object.assign(this, props);

  this._events = new EventEmitter();
  this.on = this._events.on;
  this.removeListener = this._events.removeListener;
  this.emit = this._events.emit;

  // Allow some user initialization
  if (typeof this.init === 'function') {
    this.init.call(this);
  }
}

/**
 * Helper function to create new controllers
 * @param     {Object}    props
 * @alias
 * @static
 * @return    {Controller}
 */
Controller.extend = function(props) {
  return new Controller(this, props);
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
Controller.prototype = {

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
  responses: Object.assign({}, Responses),

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
      .readAll()
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
  router: function(ceres, config, controller) {
    /**
     * Express Router
     *
     * @type    {Express.Router}
     */
    var router = require('express').Router();

    // Loop through all of them
    for (var route in this.routes) {
      if (!this.routes.hasOwnProperty(route)) {
        continue;
      }
      // Parse
      var parts = route.split(' ');

      /**
       * HTTP method
       * @type {String}
       */
      var method = parts[0].toLowerCase();

      /**
       * The sub path or tail end of a path
       * @type {String}
       */
      var path = parts[1];

      /**
       * The complete path from the root url
       * @type {String}
       */
      var fullPath = getFullPath(controller, path);

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
        ceres.log._ceres.error('%s - Ignoring %s %s: %s is not a function', controller.name, method.toUpperCase(), fullPath, fnName || 'undefined');
        // Skip if we're not a function
        continue;
      }

      // Path
      var args = [path];

      // Middleware
      if (this.middleware instanceof Array) {
        args = args.concat(this.middleware);
      } else if (typeof this.middleware === 'function') {
        // Run it
        var userMiddleware = this.middleware.call(this, config.middleware, config);

        // Ensure we're an array
        userMiddleware = userMiddleware instanceof Array !== true ? [userMiddleware] : userMiddleware;

        args = args.concat(userMiddleware);
      }

      // Attach another other user supplied middleware
      if (this.routes[route] instanceof Array) {
        args = args.concat(this.routes[route]);
      }

      // Bind custom this context to route
      var fn = wrapRoute(handler, this, ceres);

      // Add to args
      args.push(fn);

      if (typeof router[method] !== 'function') {
        ceres.log._ceres.warn('%s - Ignoring %s %s: router.%s is not a function', controller.name, method.toUpperCase(), fullPath, method);
        continue;
      }

      // Express route
      router[method].apply(router, args);
      ceres.log._ceres.silly('%s - Setting up %s %s - %s', controller.name, method.toUpperCase(), fullPath, fnName);
    }

    return router;
  }
};
