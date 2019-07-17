/** *****************************************************************************
 * CLI
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Setups up Command Line Interface
 ***************************************************************************** */

const program = require('commander');

module.exports = function cli(version, options) {
  program.version(version);

  options.forEach(function(args) {
    program.option(...args);
  });

  return program;
};
