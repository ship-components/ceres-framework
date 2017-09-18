# Ceres
Opinionated node.js framework for React single page applications

[![npm](https://img.shields.io/npm/v/ceres-framework.svg?maxAge=2592000)](https://www.npmjs.com/package/ceres-framework)
[![Build Status](http://img.shields.io/travis/ship-components/ceres-framework/master.svg?style=flat)](https://travis-ci.org/ship-components/ceres-framework)
[![Coveralls](https://img.shields.io/coveralls/ship-components/ceres-framework.svg)](https://coveralls.io/github/ship-components/ceres-framework)
[![dependencies](https://img.shields.io/david/ship-components/ceres-framework.svg?style=flat)](https://david-dm.org/ship-components/ceres-framework)

## Installation

### Command Line Interface
Ceres comes with a simple CLI to help setup the framework. Just install the package globally and it'll be available everywhere.
```
$ npm install ceres-framework -g
```

### Bootstrapping a new application

```
$ mkdir example && cd example/
$ ceres create example
$ ./example.js init
$ ./example.js run
```

## History
* 0.13.7 - Updated pg to address security advisory
* 0.13.6 - Fixed missing exit code in logging and added argv to error to better track which process is exiting
* 0.13.5 - Improved error logging and handling of worker exits. Fixed memory leak warning. Updated dependencies. Added logstash option to json logs
* 0.13.4 - Fixed issue with multiple instances of ceres being run at the same time, fixed issue with the wrong log level being using in error middleware
* 0.13.3 - Added more confiruation options for express: viewCache, viewEngine. Switched production env switch to a debug config switch since not all prod environments are called production
* 0.13.2 - Reduce log spam related to cron scripts. Fixed issue with access log not always saving and made its format configurable.
* 0.13.1 - Made session resave, saveUninitialized, and rolling configurable. Fixed view cache typo
* 0.13.0 - Added human readable log option. Fixed issue where pid wasn't created for single instance of cluster, updated dependency versions.
* 0.12.0 - Removed rotating access logs. Added option to enable access log skipping. Added trustProxy options. Made compression configurable. Added options to make cookies configurable
* 0.11.0 - Made default processManagement cluster option not sticky and moved sticky cluster to it's own option
* 0.10.1 - Added a check to see if headers have already been sent
* 0.10.0 - Removed BookshelfModel.query, Made native bookshelf functions available directly on BookshelfModel. Update error messaging middleware. Added promise support for controller methods. Switched bigints in postgres from strings to numbers. Merged parents params into children routers. Default postCreate method for bookself now returns relations
* 0.9.5 - Extracts and optimized the deepCopy function (previously as deepClone) to return the correct data format.
* 0.9.4 - Updates the deepClone function and Ceres.prototype.run function's call scope
* 0.9.3 - Added env variable so children know their index
* 0.9.0 - Removed multer from default setup and fixed issue bug preventing no database from being selected
* 0.8.0 - Add option for BookselfModel.read to read an array of ids. Fork bug fixes. Improved Logging.
* 0.7.0 - Added forking option, more unit tests and refactoring
* 0.6.1 - Refactored merge in config and added initial unit testing setup
* 0.6.0 - Added redis caching
* 0.5.2 - Upgraded logging packages, ensure timestamps are neabled and added option for custom loggers
* 0.5.0 - Add mongo support

This creates the basic folder structure and a default configuration in the current folder.

## Documentation
* [Config](docs/config.md)
* [Controllers](docs/controllers.md)
* [Models](docs/models.md)
* [Routing (see Controllers)](docs/controllers.md)
