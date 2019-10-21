/** *****************************************************************************
 * Pipeline
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Render Workflow to help ensure we consistently produce the
 *               same results across each page and prints
 ***************************************************************************** */

const _ = require('lodash');
const async = require('async');
const Promise = require('bluebird');
const Workflow = require('./Workflow');

/**
 * Create a standard pipeline
 *
 * @param     {Object}    options
 * @return    {Object}
 */
module.exports.create = function create(options) {
  /**
   * Setup the work flow options
   *
   * @type {Object}
   */
  const workflow = Workflow.setup(this.config, options);

  // Start with empty pipline
  let lines = {};

  // Grab the user supplied props
  lines.props = workflow.props;

  // Get the template
  lines.template = workflow.template(options);

  // Requires props to be done
  lines.react = ['props', workflow.react(options)];

  // Requires React Component and props to be done
  lines.payload = ['react', 'props', workflow.payload(options)];

  // Requires template and payload to be completed
  lines.html = ['template', 'payload', workflow.html(options)];

  // Allow user to override any of the above tasks
  lines = _.extend(lines, options.run);

  /**
   * API
   */
  return {
    /**
     * Expose lines
     *
     * @type    {Object}
     */
    lines,

    /**
     * Alias for async auto. Either takes a callback or returns a promise
     *
     * @param     {Function}    callback
     * @returns   {Promise}
     */
    run(callback) {
      if (_.isFunction(callback)) {
        // Callback
        async.auto(lines, callback);
        return undefined;
      }
      // Or Promise
      return new Promise((resolve, reject) => {
        async.auto(lines, (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results.html);
          }
        });
      });
    },
  };
};
