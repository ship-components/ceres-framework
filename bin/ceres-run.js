/*******************************************************************************
 * CLI
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Command Line Interface for the server
 ******************************************************************************/

var Ceres = require('../src/Ceres');
var program = require('commander');
var pkg = require(process.cwd() + '/package.json');

program
  .version(pkg.version)
  .option('-r, --rc <path>', 'Location of the config file')
  .option('-e, --env <string>', 'Which environment are we running in?')
  .option('-i, --instances <number>', 'Total number of children to spawn in the cluster', parseInt)
  .option('-p, --port <number>', 'Which port to listen to', parseInt)
  .option('-d, --debug', 'Enable debug logging')
  .option('-v, --verbose', 'Enable verbose output to console')
  .option('-w, --webpack', 'Enable webpack middleware for development')
  .parse(process.argv);

// Extract as key/value pairs
var options = program.opts();

Ceres.load(options).then(require('../src/run'));
