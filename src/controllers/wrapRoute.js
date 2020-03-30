const Promise = require('bluebird');

/**
 * @file Automatically parse the routes option on a Controller.
 */
const bindEach = require('../lib/bindAll');
const Responses = require('./Responses');

/**
 * Wrap the logic and provide a new this context
 *
 * @param     {Function}    handler
 * @param     {Object}      ctx         `this` from created Controller
 * @return    {Express.route}
 */
module.exports = function wrapRoute(handler, ctx, ceres) {
  return function requestHandler(req, res, next) {
    /**
     * Create this context
     *
     * @type    {Object}
     */
    const context = {
      /**
       * Make req available on this
       * @type {Express.Request}
       */
      req,

      /**
       * Make res available on this
       * @type {Express.Response}
       */
      res,

      /**
       * Make the next callback available so we can pass the errors along
       * @type    {Function}
       */
      next,

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
    };

    /**
     * User overridden responses
     * @type    {Object}
     */
    let responses = { ...Responses, ...(ctx || {}).responses };

    /**
     * Bind req and res to each response
     */
    responses = bindEach(responses, context);

    // Attach to context
    Object.assign(context, responses, ctx);

    // Start a promise chain so we can catch any errors

    return (
      Promise.bind(context)
        // Attempt to resolve the result of the handler
        .then(() => Promise.resolve(handler.call(context, req, res, next, ceres)))
        .then(body => {
          if (body === null || typeof body === 'undefined') {
            // If the body is empty then we can skip sending the response
            return null;
          }
          if (res.writable && !res.headersSent) {
            // Make sure the request is writable before we try to send it
            context.send(body);
            return null;
          }
          const err = new Error(
            'Unable to write response. Please return null if you are handling the response elsewhere.'
          );
          err.body = body;
          throw err;
        })
        .catch(next)
    );
  };
};
