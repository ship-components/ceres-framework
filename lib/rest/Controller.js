/*******************************************************************************
 * Controller - Base Controller
 ******************************************************************************/

var _ = require('lodash');

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
function wrapRoute(handler, ctx) {
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
      res: res
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

    return handler.call(context, req, res);
  };
}

/**
 * Export the API
 *
 * @param     {Object}    config
 * @return    {Object}
 */
module.exports = function(config) {

  /**
   * Initialized Middleware
   *
   * @type    {Object}
   */
  var Middleware = this.middleware;

  /**
   * Defaults
   *
   * @type    {Object}
   */
  var BaseController = {

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
    routes: {
      'get /': 'getAll',
      'get /:id': 'getOne',
      'post /': 'postCreate',
      'put /:id': 'putUpdate',
      'delete /:id': 'deleteOne'
    },

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
      this.model.update(req.body)
        .then(this.send)
        .catch(this.fail);
    },

    /**
     * DELETE - Delete a record
     *
     * @param    {Express.req}    req
     * @param    {Express.res}    res
     */
    deleteOne: function(req) {
      this.model.del(req.body)
        .then(this.noContent)
        .catch(this.err);
    },

    /**
     * Create a Express Router and overrde any defaults
     *
     * @return    {Express.router}
     */
    router: function() {
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

          // Path
          var args = [path];

          // Middleware
          if (_.isArray(this.middleware)) {
            args = args.concat(this.middleware);
          } else if (_.isFunction(this.middleware)) {
            var userMiddleware = this.middleware.call(this, Middleware, config);
            if(!_.isArray(userMiddleware)) {
              userMiddleware = [userMiddleware];
            }
            args = args.concat(userMiddleware);
          }

          // Get fn name aka value
          var fnName = this.routes[route];

          // Gett actual fn
          var handler = this[fnName];

          // Wrap and inject model
          var fn = wrapRoute(handler, this);

          // Add to args
          args.push(fn);

          // Express route
          router[method].apply(router, args);
        }
      }

      return router;
    }
  };

  /**
   * Recursively assign values from defs to the src reference
   *
   * @param     {Iterable...}    obj
   * @return    {Iterable}
   */
  function assign(obj) {
    // This is stores the resulting object
    var result = obj;

    // If it's not an object/function bail
    if (!_.isObject(result)) {
      return result;
    }

    var argsLength = arguments.length;

    // Start this on the section argument
    var argIndex = 0;

    // Loop through the arguments
    while (++argIndex < argsLength) {
      var iterable = arguments[argIndex];
      if (_.isObject(iterable)) {
        var objIndex = -1;
        var objProps = _.keys(iterable);
        var objLength = objProps.length;

        // Loop through each argument
        while (++objIndex < objLength) {
          var index = objProps[objIndex];
          // if(_.isObject(iterable[index])) {
          //   result[index] = assign({}, result[index], iterable[index]);
          // } else {
          result[index] = iterable[index];
        }
      }
    }

    return result;
  }

  /**
   * Helper function to create new controllers
   * @param     {Object}    props
   * @return    {Object}
   */
  function extend(props) {
    /**
     * Create an empty instance
     */
    function Controller() {}

    // Create instance
    var controller = new Controller();

    // Override defaults
    controller = assign(controller, BaseController, props);

    return controller;
  }

  return {
    extend: extend,
    wrapRoute: wrapRoute
  };
};
