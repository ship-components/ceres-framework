/**
 * Manages active models
 * @class
 */
class ModelManager {
  constructor() {
    /**
     * @private
     * @type {Array<import('./BaseModel').BaseModel>} Contains all saved models
     */
    this.models = [];
  }

  /**
   * Save an intance of a Ceres.Model
   * @param {import('./BaseModel').BaseModel} model Ceres.Model
   * @return {void}
   */
  add(model) {
    this.models.push(model);
  }

  /**
   * Get a saved instance of a Ceres.Model
   * @param {string} name The name of the model
   * @return {import('./BaseModel').BaseModel | void}
   */
  get(name) {
    const result = this.models.find(model => model.name === name);
    if (!result) {
      throw new Error(`Unable to find instance of ${name}`);
    }
    return result;
  }

  /**
   * Check to see if a model has been saved
   * @param {string} name The name of the model
   * @return {boolean}
   */
  has(name) {
    return Boolean(this.get(name));
  }

  /**
   * Convert models array to object
   */
  toObject() {
    const models = {};
    this.models.forEach(model => {
      models[model.name] = model;
    });
    return models;
  }
}

module.exports = new ModelManager();
module.exports.ModelManager = ModelManager;
