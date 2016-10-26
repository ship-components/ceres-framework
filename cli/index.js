#!/usr/bin/env node
/*******************************************************************************
 * CLI
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Command Line Interface for the server
 ******************************************************************************/

var program = require('commander');
var pkg = require(require('path').resolve(__dirname + '/../package.json'));

program.version(pkg.version)
  .command('create', 'Setup a new application')
  .command('controller', 'Create a new controller')
  .command('model', 'Create a new model')
  .parse(process.argv);
