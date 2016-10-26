#!/usr/bin/env node
/*******************************************************************************
 * CLI
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Command Line Interface for the server
 ******************************************************************************/

var program = require('commander');
var pkg = require(require('path').resolve(__dirname + '/../package.json'));
var Create = require('./lib/Create');
var path = require('path');
var Promise = require('bluebird');
var mkdirp = require('mkdirp');
var fs = require('fs');
var spawn = require('child_process').spawn;

var SERVER_ROOT = path.resolve(process.cwd(), './server');

function runCmd(cmd, args, config) {
  return new Promise(function(resolve, reject){
    var command = spawn(cmd, args);

    command.stdout.on('data', function(data){
      if (config.verbose) {
        console.log(data.toString());
      }
    });

    command.stderr.on('data', function(data){
      if (config.verbose) {
        console.log(data.toString());
      }
    });

    command.on('close', function(code){
      if(code === 0) {
        resolve();
      } else {
        reject(new Error('Non zero exit code'));
      }
    });
  });
}

function createDirectory(dir) {
  return new Promise(function(resolve, reject){
    mkdirp(dir, function(err){
      if(err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function createDirectories(paths, config){
  return Promise.each(paths, function(dir){
    if(config.verbose) {
      console.log('Creating directory %s', dir);
    }
    return createDirectory(dir);
  });
}

/**
 * Stream a file from one place to another. Supports cross partitions
 * @param  {String} original File path to copy
 * @param  {String} target   Destination of to copy to
 * @return {Promise}
 */
function copyFile(original, target) {
  return new Promise(function(resolve, reject){
    var source = fs.createReadStream(original);
    var dest = fs.createWriteStream(target);

    // Copy
    source.pipe(dest);

    // Complete
    source.on('end', resolve);

    // Error!
    source.on('error', reject);
  });
}

program.version(pkg.version)
  .option('-v, --verbose', 'Display some extra details')
  .usage('[options] <name>')
  .action(function(name, config){
    if (typeof name !== 'string' || name.length === 0) {
      program.outputHelp();
      process.exit(0);
    }

    var paths = [
      SERVER_ROOT,
      path.resolve(SERVER_ROOT, './controllers'),
      path.resolve(SERVER_ROOT, './middleware'),
      path.resolve(SERVER_ROOT, './models'),
      path.resolve(SERVER_ROOT, './lib'),
      path.resolve(SERVER_ROOT, './views'),
      path.resolve(process.cwd(), './config')
    ];

    createDirectories(paths, config)
      .then(function(){
        var filename = path.resolve(process.cwd(), './server/controllers/IndexController.js');

        if (config.verbose) {
          console.log('Creating controller %s', filename);
        }

        return Create.controller(filename, 'IndexController');
      })
      .then(function(){
        var files = [
          {
            from: path.resolve(__dirname, '../config/default.js'),
            to: path.resolve(process.cwd(), './config/default.js')
          },
          {
            from: path.resolve(__dirname, './templates/ceres.js'),
            to: path.resolve(process.cwd(), './' + name + '.js')
          },
          {
            from: path.resolve(__dirname, './templates/ceres-run.js'),
            to: path.resolve(process.cwd(), './' + name + '-run.js')
          },
          {
            from: path.resolve(__dirname, './templates/ceres-init.js'),
            to: path.resolve(process.cwd(), './' + name + '-init.js')
          }
        ];

        return Promise.each(files, function(file){
          if (config.verbose) {
            console.log('Saving file to %s', file.to);
          }
          return copyFile(file.from, file.to);
        });
      })
      .then(function(){

        var commands = [
          {
            cmd: 'npm',
            args: ['init', '-y']
          },
          // {
          //   cmd: 'npm',
          //   args: ['install', 'ceres-framework@latest', '--save']
          // },
          {
            cmd: 'chmod',
            args: ['u+x', path.resolve(process.cwd(), './' + name + '.js')]
          }
        ];

        return Promise.each(commands, function(item){
          if (config.verbose) {
            console.log('Running %s %s', item.cmd, item.args.join(' '));
          }
          return runCmd(item.cmd, item.args, config);
        });
      })
      .then(function(){
        console.log('Success');
      })
      .catch(function(err){
        console.error(err.stack);
        process.exit(1);
      });
  })
  .parse(process.argv);

if (program.args.length === 0) {
  program.outputHelp();
  process.exit();
}
