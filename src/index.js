/*******************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         By default export a singleton
 ******************************************************************************/

var Ceres = require('./Ceres');

var instance = new Ceres();

module.exports = instance;
