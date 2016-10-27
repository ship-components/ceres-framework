
var ReactDOMServer = require('react-dom/server');
var React = require('react');
var _ = require('lodash');
var fs = require('fs');
var ejs = require('ejs');

/**
 * Recursive object clone
 *
 * @param     {Object}    obj
 * @return    {Object}
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  var src = obj.constructor();
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      src[key] = deepClone(obj[key]);
    }
  }
  return src;
}

module.exports.setup = function(config, props) {
  /**
   * Configure Asset Factor
   *
   * @type    {Object}
   */
  var AssetFactory = require('./AssetFactory.js')(config);

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
      return function(results, done) {
        var html = '';
        // Skip if we have no component
        if (typeof options.component !== 'function') {
          done(null, html);
          return;
        }
        try {
          html = ReactDOMServer.renderToString(React.createElement(options.component, deepClone(results.props)));
        } catch (err) { // Catch any errors in the front end so they dont' crash the backend
          console.error('ReactRenderError', err, err.stack);
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
     * Read checksums cache file from disk
     *
     * @return    {Async.auto}
     */
    checksums: function(options) {
      return function(done) {
        fs.readFile(options.checksumrc || config.render.checksumrc, {
          encoding: 'utf8'
        }, function(err, src) {
          if (err) {
            done(err);
            return;
          }

          // Parse
          try {
            var checksums = JSON.parse(src);
            done(null, checksums);
          } catch (e) {
            done(e);
          }
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
      return function(results, done) {
        // Load asset information
        var payload = {
          component: results.react,
          props: JSON.stringify(results.props),
          version: config.version,
          title: options.title,
          env: config.env,
          index: options.index,
          assets: AssetFactory(options.assets, results.checksums).forPayload()
        };
        done(null, payload);
      };
    },

    /**
     * Renders the final html and optimizes it
     * @return    {Async.auto}
   */
    html: function() {
      return function render(results, done) {
        // Render
        var html = ejs.render(results.template, results.payload);

        // Return
        done(null, html);
      };
    }
  };

  return _.extend(Workflow, props);
};
