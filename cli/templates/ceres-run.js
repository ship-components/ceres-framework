/*******************************************************************************
 * Run the server
 ******************************************************************************/

var Ceres = require('ceres-framework');
var cli = require('ceres-framework/src/lib/CLI');
var pkg = require(process.cwd() + '/package.json');

var program = cli(pkg.version, require('ceres-framework/config/cli').run)
  .option('--developer', 'Turn on all developer options')
  .parse(process.argv);

var config = program.opts();

if (config.developer) {
  // Shortcut
  config.verbose =true;
  config.env = config.env || process.env.NODE_ENV || 'dev';
  process.env.NODE_ENV = config.env;
  config.instances = config.instances || 1;
}

Ceres.exec(Ceres.run, config);
