/**
 * Base Ceres Model
 * @class
 * @namespace Ceres.BaseModel
 */
class BaseModel {
  /**
   * Initialize the model and attach the database connection
   * @param { import ("../Ceres") }  ceres
   */
  constructor(ceres) {
    if (!ceres.initialized) {
      throw new Error(`Ceres has not been initialized yet`);
    }

    /**
     * Name of the model
     * @type {string}
     */
    this.name = this.constructor.name;

    /**
     * Ceres Config
     * @type { import("../../config/default") }
     */
    this.config = ceres.config;

    if (ceres.config.db.type === 'bookshelf') {
      this.database = ceres.Database.bookshelf;
    } else {
      throw new Error(`Unknown database type ${ceres.config.db.type}`);
    }

    this.logger = ceres.logger(this.constructor.name);

    /**
     * @type {Function?}
     */
    this.init = this.init || undefined;

    if (typeof this.init === 'function') {
      const handler = () => {
        this.init();
        // Only run it once
        ceres.removeListener(ceres.CeresEvents.Connected, handler);
      };
      ceres.on(ceres.CeresEvents.Connected, handler);
    }

    ceres.Model[this.name.replace(/Model$/i, '')] = this;
    ceres.Model.add(this);
  }
}

module.exports.BaseModel = BaseModel;
