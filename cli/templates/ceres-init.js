/** *****************************************************************************
 * Setup the initial config
 ***************************************************************************** */

const generateSecret = require('ceres-framework/src/lib/GenerateSecret');

const pkg = require(`${process.cwd()}/package.json`);
const config = require('ceres-framework/config/cli');
const cli = require('ceres-framework/src/lib/CLI');

// Setup
const program = cli(pkg.version, config.init).parse(process.argv);

generateSecret(pkg, program.opts()).save(function(err, options) {
  if (err) {
    throw err;
  }
  console.log('Key successfully generated and saved to %s', options.rc);
});
