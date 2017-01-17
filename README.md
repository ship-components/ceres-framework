# Ceres
Node.js framework for React.js Applications

[![npm](https://img.shields.io/npm/v/ceres-framework.svg?maxAge=2592000)](https://www.npmjs.com/package/ceres-framework)

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
