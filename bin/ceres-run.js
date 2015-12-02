/*******************************************************************************
 * CLI
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Command Line Interface for the server
 ******************************************************************************/

var Ceres = require('../src/Ceres');

var pkg = require(process.cwd() + '/package.json');
var config = require('../config/cli');
var CLI = require('../src/lib/CLI');

var program = CLI(pkg.version, config.run).parse(process.argv);

// Extract as key/value pairs
var options = program.opts();

Ceres.load(options).then(require('../src/run'));
