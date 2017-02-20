# Ceres
Opinionated node.js framework for React single page applications

[![npm](https://img.shields.io/npm/v/ceres-framework.svg?maxAge=2592000)](https://www.npmjs.com/package/ceres-framework)
[![Build Status](http://img.shields.io/travis/isuttell/ceres-framework/master.svg?style=flat)](https://travis-ci.org/isuttell/ceres-framework)
[![dependencies](https://img.shields.io/david/isuttell/ceres-framework.svg?style=flat)](https://david-dm.org/isuttell/ceres-framework)
[![devDependencies](https://img.shields.io/david/dev/isuttell/ceres-framework.svg?style=flat)](https://david-dm.org/isuttell/ceres-framework?type=dev)

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
