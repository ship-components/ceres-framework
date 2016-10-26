#!/usr/bin/env node
var program = require('commander');
var pkg = require(require('path').resolve(__dirname + '/../package.json'));
var Create = require('./lib/Create');
var path = require('path');

program.version(pkg.version)
  .option('-v, --verbose', 'Display some extra details')
  .usage('[options] <name>')
  .action(function(name, config){
    if (typeof name !== 'string') {
      program.outputHelp();
      process.exit(0);
    }

    var filename = path.resolve(process.cwd(), './server/models/', name + '.js');

    if (config.verbose) {
      console.log('[VERBOSE] Saving to %s', filename);
    }

    Create.model(filename, name)
      .then(function(){
        console.log('');
        console.log('%s successfully created', name);
        console.log('');
      })
      .catch(function(err){
        console.error(err.stack);
        process.exit(1);
      });
  })
  .parse(process.argv);
