#!/usr/bin/env node
/** *****************************************************************************
 * CLI
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Command Line Interface for the server
 ***************************************************************************** */

const program = require('commander');
const pkg = require(require('path').resolve(`${__dirname}/../package.json`));
const path = require('path');
const Create = require('./lib/Create');

program
  .version(pkg.version)
  .option('-v, --verbose', 'Display some extra details')
  .usage('[options] <name>')
  .action(function(name, config) {
    if (typeof name !== 'string') {
      program.outputHelp();
      process.exit(0);
    }

    const filename = path.resolve(process.cwd(), './server/controllers/', `${name}.js`);

    if (config.verbose) {
      console.log('[VERBOSE] Saving to %s', filename);
    }

    Create.controller(filename, name)
      .then(function() {
        console.log('');
        console.log('%s successfully created', name);
        console.log('Do not forget to add it to your list of controllers in config/default.js');
        console.log('');
      })
      .catch(function(err) {
        console.error(err.stack);
        process.exit(1);
      });
  })
  .parse(process.argv);
