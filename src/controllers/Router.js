var express = require('express');

/**
 * @file Automatically parse the routes option on a Controller.
 */
var bindEach = require('../lib/bindAll');
var Responses = require('../lib/Responses');

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
 * Takes a string or a function
 * @param    {Mixed}    val    [description]
 * @return   {String}
 */
function getFunctionName(val) {
	if (typeof val === 'string') {
		// Default
		return val;
	} else if (typeof val === 'function') {
		return val.constructor.name;
	}
	return;
}

/**
 * Attempt to get the function either from the last arg or the controller
 * @param    {Controller}    	controller
 * @param    {Mixed}    			lastArg
 * @return   {Function}
 */
function getHandler(controller, lastArg) {
	if (typeof lastArg === 'function') {
		return lastArg;
	} else if (typeof lastArg === 'string') {
		// By default look for a method with the fnName on `this`
		return controller[lastArg];
	}
	return;
}

/**
 * Setup middlware
 * @param    {Controller}    controller
 * @param    {Ceres}         ceres
 * @param    {String}        route
 * @return   {Array<Function>}
 */
function getMiddleware(controller, ceres, route) {
	var args = [];
	// Controller Middleware
	if (controller.middleware instanceof Array) {
		args = args.concat(controller.middleware);
	} else if (typeof controller.middleware === 'function') {
		// Run it once so we can configure it. It should return a function
		var userMiddleware = controller.middleware.call(controller, ceres.config.middleware, ceres.config);

		args = args.concat(userMiddleware instanceof Array !== true ? [userMiddleware] : userMiddleware);
	}

	// Attach another other user supplied middleware
	if (controller.routes[route] instanceof Array) {
		args = args.concat(controller.routes[route]);
	}

	return args;
}

/**
 * Pop the last arg off the route which is the main route
 * @param    {Contrlller}    controller
 * @param    {String}        route
 * @return   {Mixed}
 */
function getLastArg(controller, route) {
	if (controller.routes[route] instanceof Array) {
		// Array option so users can inject middleware
		return controller.routes[route].pop();
	} else {
		return controller.routes[route];
	}
}

/**
 * Parse route string from routes
 * @param    {String}    route
 * @return   {Object}
 */
function parseRouteString(route) {
	// Parse
	var parts = route.split(' ');

	if(parts.length !== 2) {
		throw new Error('Invalid path string');
	}

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

	return {
		method: method,
		path: path
	};
}

/**
 * Configure a router based on an object
 * @param    {Controller}    controller
 * @param    {Ceres}         ceres
 */
function controllerRoutes(controller, ceres) {
	if (typeof controller.routes !== 'object'){
		throw Error('Missing controller.routes');
	}

	/**
	 * Final results
	 * @type    {Array<Object>}
	 */
	var routes = [];

	// Loop through all of them
	for (var route in controller.routes) {
		if (!controller.routes.hasOwnProperty(route)) {
			continue;
		}

		// Parse
		var parts = parseRouteString(route);

		/**
		 * HTTP method
		 * @type {String}
		 */
		var method = parts.method;

		/**
		 * The sub path or tail end of a path
		 * @type {String}
		 */
		var path = parts.path;

		/**
		 * The complete path from the root url
		 * @type {String}
		 */
		var fullPath = getFullPath(controller, path);

		/**
		 * Get the last argument which is the main method
		 * @type    {Mixed}
		 */
		var lastArg = getLastArg(controller, route);

		/**
		 * Get fn name aka value
		 * @type    {String}
		 */
		var fnName = getFunctionName(lastArg);

	/**
	 * Fet actual fn
	 * @type    {Function}
	 */
		var handler = getHandler(controller, lastArg);

		if (typeof handler !== 'function') {
			throw new Error(fullPath + ' - ' + controller.name + '.' + fnName + ' is not a function');
		}

		/**
		 * Setup middleware for controller and route
		 * @type    {Array<Functions>}
		 */
		var args = getMiddleware(controller, ceres, route);

		// Ensure middleware functons are valid
		args.forEach(function(arg){
			if (typeof arg !== 'function') {
				throw new Error('middleware is not a function');
			}
		});

		// Add the path to the front
		args.unshift(path);

		/**
		 * Bind custom this context to route
		 * @type    {Function}
		 */
		var fn = wrapRoute(handler, controller, ceres);

		// Add to args at the end
		args.push(fn);

		// Ensure the method exists in Express
		if (typeof express.Router[method] !== 'function') {
			throw new Error(controller.name + ' - Ignoring ' + method.toUpperCase() + ' ' + fullPath + ': router.' + method + ' is not a function');
		}

		// Save
		routes.push({
			method: method,
			args: args
		});

		// Log
		ceres.log._ceres.silly('%s - Setting up %s %s - %s', controller.name, method.toUpperCase(), fullPath, fnName);
	}

	return routes;
}

/**
 * Return a Express Router. Bound to a controller instance
 * @param    {Ceres}    			ceres
 * @return   {Express.Router}
 */
module.exports = function controllerRouter(ceres) {
	var router = new express.Router();
	var routes = controllerRoutes(this, ceres);
	routes.forEach(function(route){
		router[route.method].apply(router, route.args);
	});
	return router;
};

/**
 * Export so we can test
 * @type    {Function}
 */
module.exports.routes = controllerRoutes;
