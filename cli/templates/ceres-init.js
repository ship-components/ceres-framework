/*******************************************************************************
 * Setup the initial config
 ******************************************************************************/

var generateSecret = require('ceres-framework/src/lib/GenerateSecret');
var pkg = require(process.cwd() + '/package.json');
var config = require('ceres-framework/config/cli');
var cli = require('ceres-framework/src/lib/CLI');

// Setup
var program = cli(pkg.version, config.init).parse(process.argv);

generateSecret(pkg, program.opts()).save(function(err, options) {
  if (err) {
    throw err;
  }
  console.log('Key successfully generated and saved to %s', options.rc);
});
