/*******************************************************************************
 * init
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Generate a secret key for the application
 ******************************************************************************/

var program = require('commander');

var GenerateSecret = require('../src/lib/GenerateSecret');

var pkg = require(process.cwd() + '/package.json');

program
  .version(pkg.version)
  .option('-r, --rc <path>', 'Location of the config file')
  .option('-l, --length <number>', 'How long should the secret be?', parseInt)
  .parse(process.argv);

GenerateSecret(pkg, program.opts()).save(function(err, options) {
  if (err) {
    throw err;
  }
  console.log('Key successfully generated and saved to %s', options.rc);
});
