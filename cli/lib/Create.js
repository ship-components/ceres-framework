const Promise = require('bluebird');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');

/**
 * EJS Templates
 * @type {Object}
 */
const Template = {
  controller: fs.readFileSync(path.resolve(__dirname, '../templates/controller.ejs'), {
    encoding: 'utf8',
  }),

  model: fs.readFileSync(path.resolve(__dirname, '../templates/model.ejs'), { encoding: 'utf8' }),
};

/**
 * Check if a file is readable
 * @param  {String} path
 * @return {Promise}
 */
function checkIfExists(filename) {
  return new Promise((resolve, reject) => {
    // Check to see if we can access the file
    fs.access(filename, err => {
      if (err) {
        resolve();
      } else {
        reject(new Error(`File exists: ${filename}`));
      }
    });
  });
}

module.exports = {
  controller(filename, name) {
    return new Promise((resolve, reject) => {
      let str = '';
      try {
        str = ejs.render(Template.controller, {
          name,
        });
      } catch (err) {
        reject(err);
        return undefined;
      }

      checkIfExists(filename)
        .then(() => {
          fs.writeFile(filename, str, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        })
        .catch(reject);
      return undefined;
    });
  },

  model(filename, name) {
    return new Promise((resolve, reject) => {
      let str = '';
      try {
        str = ejs.render(Template.model, {
          name,
        });
      } catch (err) {
        reject(err);
        return undefined;
      }

      checkIfExists(filename)
        .then(() => {
          fs.writeFile(filename, str, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        })
        .catch(reject);
      return undefined;
    });
  },
};
