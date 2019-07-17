/** *****************************************************************************
 * Ceres
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         By default export a singleton
 ***************************************************************************** */

const Ceres = require('./Ceres');

const instance = new Ceres();

module.exports = instance;
