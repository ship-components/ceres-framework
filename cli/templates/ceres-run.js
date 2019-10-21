/** *****************************************************************************
 * Run the server
 ***************************************************************************** */

const Ceres = require('ceres-framework');
const cli = require('ceres-framework/src/lib/CLI');

const pkg = require(`${process.cwd()}/package.json`);

const program = cli(pkg.version, require('ceres-framework/config/cli').run)
  .option('--developer', 'Turn on all developer options')
  .parse(process.argv);

const config = program.opts();

if (config.developer) {
  // Shortcut
  config.verbose = true;
  config.env = config.env || process.env.NODE_ENV || 'dev';
  process.env.NODE_ENV = config.env;
  config.instances = config.instances || 1;
}

Ceres.exec(Ceres.run, config);
