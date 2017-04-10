# Ceres
Opinionated node.js framework for React single page applications

[![npm](https://img.shields.io/npm/v/ceres-framework.svg?maxAge=2592000)](https://www.npmjs.com/package/ceres-framework)
[![Build Status](http://img.shields.io/travis/isuttell/ceres-framework/master.svg?style=flat)](https://travis-ci.org/isuttell/ceres-framework)
[![Coveralls](https://img.shields.io/coveralls/isuttell/ceres-framework.svg)](https://coveralls.io/github/isuttell/ceres-framework)
[![dependencies](https://img.shields.io/david/isuttell/ceres-framework.svg?style=flat)](https://david-dm.org/isuttell/ceres-framework)

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
* 0.10.0 - Removed BookshelfModel.query, Made native bookshelf functions available directly on BookshelfModel. Update error messaging middleware. Added promise support for controller methods. Switched bigints in postgres from strings to numbers. Merged parents params into children routers. Default postCreate method for bookself now returns relations
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
