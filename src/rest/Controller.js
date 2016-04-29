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
var wrapRoute = module.exports.wrapRoute = function wrapRoute(handler, ctx) {
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
};

/**
 * Defaults
 *
 * @type    {Object}
 */
var BaseController = {

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
  routes: {
    'get /': 'getAll',
    'get /:id': 'getOne',
    'post /': 'postCreate',
    'put /:id?': 'putUpdate',
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
    if (req.params.id) {
      // Update single
      this.model.update(req.body, req.params.id)
        .then(this.send)
        .catch(this.fail);
    } else {
      // Update multiple
      this.model.updateAll(req.body)
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
      .then(this.noContent)
      .catch(this.fail);
  },

  /**
   * Create a Express Router and overrde any defaults
   *
   * @return    {Express.router}
   */
  router: function(config) {
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
          var userMiddleware = this.middleware.call(this, config.middleware, config);
          if (!_.isArray(userMiddleware)) {
            userMiddleware = [userMiddleware];
          }
          args = args.concat(userMiddleware);
        }

        // Get fn name aka value
        var fnName = this.routes[route];

        // Gett actual fn
        var handler = this[fnName];
        if (typeof handler !== 'function') {
          // Skip if we're not a function
          continue;
        }

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
 * Helper function to create new controllers
 * @param     {Object}    props
 * @return    {Object}
 */
module.exports.extend = function(props) {
  // Override defaults
  var controller = _.merge({}, BaseController, props);

  return controller;
};
