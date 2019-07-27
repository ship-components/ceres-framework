const Ceres = require('./Ceres');
const { BookshelfModel } = require('./models/BookshelfModel');

// Ensure there is only once instance of Ceres at any time
if (global.Ceres) {
  module.exports = global.Ceres;
} else {
  const instance = new Ceres();

  /**
   * Ceres Bookshelf Model
   */
  instance.BookshelfModel = BookshelfModel;

  global.Ceres = instance;

  module.exports = instance;
}
