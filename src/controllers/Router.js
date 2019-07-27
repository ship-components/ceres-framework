const express = require('express');
const wrapRoute = require('./wrapRoute');

/**
 * Get the full path of a controller endpoint
 * @param  {Object} controller
 * @param  {String} path
 * @return {String}
 */
function getFullPath(controller, path) {
  return (controller.endpoint + path).replace('//', '/');
}

/**
 * Takes a string or a function
 * @param    {any}    val    [description]
 * @return   {String}
 */
function getFunctionName(val) {
  if (typeof val === 'string') {
    // Default
    return val;
  }
  if (typeof val === 'function') {
    return val.constructor.name;
  }
  return undefined;
}

/**
 * Attempt to get the function either from the last arg or the controller
 * @param    {import('./Controller')} controller
 * @param    {any} lastArg
 * @return   {Function}
 */
function getHandler(controller, lastArg) {
  if (typeof lastArg === 'function') {
    return lastArg;
  }
  if (typeof lastArg === 'string') {
    // By default look for a method with the fnName on `this`
    return controller[lastArg];
  }
  return undefined;
}

/**
 * Setup middlware
 * @param    {import('./Controller')} controller
 * @param    {import('../Ceres')} ceres
 * @param    {String} route
 * @return   {Array<Function>}
 */
function getMiddleware(controller, ceres, route) {
  let args = [];
  // Controller Middleware
  if (controller.middleware instanceof Array) {
    args = args.concat(controller.middleware);
  } else if (typeof controller.middleware === 'function') {
    // Run it once so we can configure it. It should return a function
    const userMiddleware = controller.middleware.call(
      controller,
      ceres.config.middleware,
      ceres.config
    );

    args = args.concat(
      userMiddleware instanceof Array !== true ? [userMiddleware] : userMiddleware
    );
  }

  // Attach another other user supplied middleware
  if (controller.routes[route] instanceof Array) {
    args = args.concat(controller.routes[route]);
  }

  return args;
}

/**
 * Pop the last arg off the route which is the main route
 * @param    {import('./Controller')} controller
 * @param    {string} route
 * @return   {any}
 */
function getLastArg(controller, route) {
  if (controller.routes[route] instanceof Array) {
    // Array option so users can inject middleware
    return controller.routes[route].pop();
  }
  return controller.routes[route];
}

/**
 * Parse route string from routes
 * @param    {string}    route
 * @return   {{method: string, path: string}}
 */
function parseRouteString(route) {
  // Parse
  const parts = route.split(' ');

  if (parts.length !== 2) {
    throw new Error('Invalid path string');
  }

  /**
   * HTTP method
   * @type {String}
   */
  const method = parts[0].toLowerCase();

  /**
   * The sub path or tail end of a path
   * @type {String}
   */
  const path = parts[1];

  return {
    method,
    path,
  };
}

/**
 * Configure a router based on an object
 * @param    {import('./Controller')} controller
 * @param    {import('../Ceres')} ceres
 */
function controllerRoutes(controller, ceres) {
  if (typeof controller.routes !== 'object') {
    throw Error('Missing controller.routes');
  }

  /**
   * Final results
   * @type    {Array<Object>}
   */
  const routes = [];

  // Loop through all of them
  Object.keys(controller.routes).forEach(route => {
    // Parse
    const { method, path } = parseRouteString(route);

    /**
     * The complete path from the root url
     * @type {String}
     */
    const fullPath = getFullPath(controller, path);

    /**
     * Get the last argument which is the main method
     * @type    {Mixed}
     */
    const lastArg = getLastArg(controller, route);

    /**
     * Get fn name aka value
     * @type    {String}
     */
    const fnName = getFunctionName(lastArg);

    /**
     * Fet actual fn
     * @type    {Function}
     */
    const handler = getHandler(controller, lastArg);

    if (typeof handler !== 'function') {
      throw new Error(`${fullPath} - ${controller.name}.${fnName} is not a function`);
    }

    /**
     * Setup middleware for controller and route
     * @type    {Array<Functions>}
     */
    const args = getMiddleware(controller, ceres, route);

    // Ensure middleware functons are valid
    args.forEach(arg => {
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
    const fn = wrapRoute(handler, controller, ceres);

    // Add to args at the end
    args.push(fn);

    // Ensure the method exists in Express
    if (typeof express.Router[method] !== 'function') {
      throw new Error(
        `${
          controller.name
        } - Ignoring ${method.toUpperCase()} ${fullPath}: router.${method} is not a function`
      );
    }

    // Save
    routes.push({
      method,
      args,
    });

    // Log
    ceres.log.internal.silly(
      '%s - Setting up %s %s - %s',
      controller.name,
      method.toUpperCase(),
      fullPath,
      fnName
    );
  });

  return routes;
}

/**
 * Return a Express Router. Bound to a controller instance
 * @param    {Ceres}    			ceres
 * @return   {Express.Router}
 */
module.exports = function controllerRouter(ceres) {
  const router = new express.Router({
    mergeParams: true,
  });
  const routes = controllerRoutes(this, ceres);
  routes.forEach(route => {
    router[route.method](...route.args);
  });
  return router;
};

/**
 * Export so we can test
 * @type    {Function}
 */
module.exports.routes = controllerRoutes;
