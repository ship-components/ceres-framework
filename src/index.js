/*******************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         By default export a singleton
 ******************************************************************************/

var Ceres = require('./Ceres');

var instance = new Ceres();

/**
 * Alias to run
 * @alias
 * @static
 */
instance.run = require('./run');

module.exports = instance;
