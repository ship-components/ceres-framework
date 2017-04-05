
var ReactDOMServer = require('react-dom/server');
var React = require('react');
var fs = require('fs');
var ejs = require('ejs');

var deepCopy = require('../lib/deepCopy');

module.exports.setup = function(config, props) {
  /**
   * Configure Asset Factor
   *
   * @type    {Object}
   */
  var assetFactory = require('./AssetFactory.js')(config);

   /**
   * This object contains methods that return Async.auto objects. Each item has a
   * list of dependencies it requires. Async.auto attempts to run them as many
   * things in parallel as it can.
   *
   * @type    {Object}
   */
  var Workflow = {

    /**
     * Renders a react component.
     *
     * @param     {React}    comp
     * @return    {Async.auto}
     */
    react: function(options) {
      return function(done, results) {
        require('../index').log.silly('Rendering react component');
        var html = '';
        // Skip if we have no component
        if (typeof options.component !== 'function') {
          require('../index').log.silly('No react component found, skipping...');
          done(null, html);
          return;
        }
        try {
          html = ReactDOMServer.renderToString(React.createElement(options.component, deepCopy(results.props)));
        } catch (err) { // Catch any errors in the front end so they dont' crash the backend
          require('../index').log.error('ReactRenderError', err);
        } finally {
          done(null, html);
        }
      };
    },

    /**
     * Gets the template
     * @return    {Async.auto}
     */
    template: function(options) {
      return function(done) {
        require('../index').log.silly('Reading template');

        var template = config.render.template;
        if (options && typeof options.templatePath === 'string') {
          template = options.templatePath;
        }

        fs.readFile(template, {
          encoding: 'utf8'
        }, function(err, src) {
          if(err) {
            done(err);
            return;
          }

          if (options.minifyHtml || config.render.minifyHtml) {
            // Strip line breaks
            src = src.replace( /[\n\r]+/g, ' ');

            // Strip extra spaces
            src = src.replace( /\s\s+/g, ' ');
          }

          done(null, src);
        });
      };
    },

    /**
     * Organizes the data for the template
     *
     * @param     {String}    entry    Which js to load
     * @return    {Async.auto}
     */
    payload: function(options) {
      return function(done, results) {
        require('../index').log.silly('Parsing props');

        // Load asset information
        var payload = {
          component: results.react,
          props: JSON.stringify(results.props),
          version: config.version,
          title: options.title,
          env: config.env,
          index: options.index,
          assets: assetFactory(options.assets, results.checksums).forPayload()
        };
        done(null, payload);
      };
    },

    /**
     * Renders the final html and optimizes it
     * @return    {Async.auto}
   */
    html: function() {
      return function render(done, results) {
        require('../index').log.silly('Rendering html');

        // Render
        var html = ejs.render(results.template, results.payload);

        // Return
        done(null, html);
      };
    }
  };

  return Object.assign(Workflow, props);
};
