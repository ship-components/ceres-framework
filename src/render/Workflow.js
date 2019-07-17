// eslint-disable-next-line import/no-extraneous-dependencies
const ReactDOMServer = require('react-dom/server');
// eslint-disable-next-line import/no-extraneous-dependencies
const React = require('react');
const fs = require('fs');
const ejs = require('ejs');

const deepCopy = require('../lib/deepCopy');

module.exports.setup = (config, props) => {
  /**
   * Configure Asset Factor
   *
   * @type    {Object}
   */
  const assetFactory = require('./AssetFactory.js')(config);

  /**
   * This object contains methods that return Async.auto objects. Each item has a
   * list of dependencies it requires. Async.auto attempts to run them as many
   * things in parallel as it can.
   *
   * @type    {Object}
   */
  const Workflow = {
    /**
     * Renders a react component.
     *
     * @param     {React}    comp
     * @return    {Async.auto}
     */
    react(options) {
      return (done, results) => {
        require('../index').log.silly('Rendering react component');
        let html = '';
        // Skip if we have no component
        if (typeof options.component !== 'function') {
          require('../index').log.silly('No react component found, skipping...');
          done(null, html);
          return;
        }
        try {
          html = ReactDOMServer.renderToString(
            React.createElement(options.component, deepCopy(results.props))
          );
        } catch (err) {
          // Catch any errors in the front end so they dont' crash the backend
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
    template(options) {
      return done => {
        require('../index').log.silly('Reading template');

        let { template } = config.render;
        if (options && typeof options.templatePath === 'string') {
          template = options.templatePath;
        }

        fs.readFile(
          template,
          {
            encoding: 'utf8',
          },
          (err, src) => {
            if (err) {
              done(err);
              return;
            }

            if (options.minifyHtml || config.render.minifyHtml) {
              // Strip line breaks
              src = src.replace(/[\n\r]+/g, ' ');

              // Strip extra spaces
              src = src.replace(/\s\s+/g, ' ');
            }

            done(null, src);
          }
        );
      };
    },

    /**
     * Organizes the data for the template
     *
     * @param     {String}    entry    Which js to load
     * @return    {Async.auto}
     */
    payload(options) {
      return (done, results) => {
        require('../index').log.silly('Parsing props');

        // Load asset information
        const payload = {
          component: results.react,
          props: JSON.stringify(results.props),
          version: config.version,
          title: options.title,
          env: config.env,
          index: options.index,
          assets: assetFactory(options.assets, results.checksums).forPayload(),
        };
        done(null, payload);
      };
    },

    /**
     * Renders the final html and optimizes it
     * @return    {Async.auto}
     */
    html() {
      return function render(done, results) {
        require('../index').log.silly('Rendering html');

        // Render
        const html = ejs.render(results.template, results.payload);

        // Return
        done(null, html);
      };
    },
  };

  return Object.assign(Workflow, props);
};
