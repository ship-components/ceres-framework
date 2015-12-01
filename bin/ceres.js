#!/usr/bin/env node
/*******************************************************************************
 * CLI
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Command Line Interface for the server
 ******************************************************************************/

var program = require('commander');

var pkg = require(process.cwd() + '/package.json');

program
  .version(pkg.version)
  .command('run', 'Start the server', {isDefault: true})
  .command('init', 'Run the initialization scripts needed for the server to run')
  .parse(process.argv);
