/*******************************************************************************
 * init
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Generate a secret key for the application
 ******************************************************************************/

var GenerateSecret = require('../src/lib/GenerateSecret');
var pkg = require(process.cwd() + '/package.json');
var config = require('../config/cli');
var CLI = require('../src/lib/CLI');

// Setup
var program = CLI(pkg.version, config.init).parse(process.argv);

GenerateSecret(pkg, program.opts()).save(function(err, options) {
  if (err) {
    throw err;
  }
  console.log('Key successfully generated and saved to %s', options.rc);
});
