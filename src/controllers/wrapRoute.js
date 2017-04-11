var Promise = require('bluebird');

/**
 * @file Automatically parse the routes option on a Controller.
 */
var bindEach = require('../lib/bindAll');
var Responses = require('./Responses');

/**
 * Wrap the logic and provide a new this context
 *
 * @param     {Function}    handler
 * @param     {Object}      ctx         `this` from created Controller
 * @return    {Express.route}
 */
module.exports = function wrapRoute(handler, ctx, ceres) {
  return function(req, res, next) {
    /**
     * Create this context
     *
     * @type    {Object}
     */
    var context = {
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
			 * Make the next callback available so we can pass the errors along
			 * @type    {Function}
			 */
			next: next,

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
      controller: ctx
    };

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
    Object.assign(context, responses, ctx);

    // Attempt to catch any errors and handle them gracefully
    try {
			var result = handler.call(context, req, res, next, ceres);

			if (result instanceof Promise) {
				// If we see a promise then try to send the body automatically
				return result
					.then(function(body){
						// Make sure the request is writable and that we have something to send
						if (res.writable) {
							context.send(body);
						} else {
							ceres.log._ceres.debug('Unable to write body', body);
						}
					})
					.catch(next);
				}
		} catch(err) {
			next(err);
		}
  };
};
