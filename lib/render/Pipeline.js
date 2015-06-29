/*******************************************************************************
 * Pipeline
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Render Workflow to hepl ensure we consistently produce the
 *               same results across each page and prints
 ******************************************************************************/
 
var _ = require('lodash');
var async = require('async');

module.exports = function(config) {
  /**
   * Load Workflow
   *
   * @type    {Object}
   */
  var Workflow = require('./Workflow.js')(config);

  /**
   * Public API
   *
   * @type    {Object}
   */
  var Pipeline = {
    /**
     * Make these available in case we want to construct our own pipeline
     *
     * @public
     * @type    {Object}
     */
    workflow: Workflow,

    /**
     * Create a standard pipeline
     *
     * @param     {Object}    options
     * @return    {Object}
     */
    create: function(options) {
      var lines = {};

      // Grab the user supplied props
      lines.props = options.props;

      // Get the template
      lines.template = Workflow.template(options);

      // Requires props to be done
      lines.component = ['props', Workflow.component(options)];

      // Requires React Component and props to be done
      lines.payload = ['component', 'props', Workflow.payload(options)];

      // Inject checksums
      if(options.assets.checksums) {
        lines.payload = ['checksums'].concat(lines.payload);
        lines.checksums = Workflow.checksums(options);
      }

      // Requires template and payload to be completed
      lines.html = ['template', 'payload', Workflow.html(options)];

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
        lines: lines,

        /**
         * Alias for async auto
         *
         * @param     {Function}    callback
         */
        run: function(callback) {
          async.auto(lines, callback);
        }
      };
    }
  };

  return Pipeline;
};
