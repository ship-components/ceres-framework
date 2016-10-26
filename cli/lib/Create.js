var Promise = require('bluebird');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');

/**
 * EJS Templates
 * @type {Object}
 */
var Template = {
  controller: fs.readFileSync(path.resolve(__dirname, '../templates/controller.ejs'), {encoding: 'utf8'}),

  model: fs.readFileSync(path.resolve(__dirname, '../templates/model.ejs'), {encoding: 'utf8'})
};

/**
 * Check if a file is readable
 * @param  {String} path
 * @return {Promise}
 */
function checkIfExists(filename) {
  return new Promise(function(resolve, reject){
    // Check to see if we can access the file
    fs.access(filename, function(err){
      if (err) {
        resolve();
      } else {
        reject(new Error('File exists'));
      }
    });
  });
}

module.exports = {

  controller: function(filename, name){
    return new Promise(function(resolve, reject){
      var str = '';
      try {
        str = ejs.render(Template.controller, {
          name: name
        });
      } catch (err) {
        return reject(err);
      }

      checkIfExists(filename)
        .then(function(){
          fs.writeFile(filename, str, function(err){
            if(err) {
              reject(err);
            } else {
              resolve();
            }
          });
        })
        .catch(reject);
    });
  },

  model: function(filename, name){
    return new Promise(function(resolve, reject){
      var str = '';
      try {
        str = ejs.render(Template.model, {
          name: name
        });
      } catch (err) {
        return reject(err);
      }

      checkIfExists(filename)
        .then(function(){
          fs.writeFile(filename, str, function(err){
            if(err) {
              reject(err);
            } else {
              resolve();
            }
          });
        })
        .catch(reject);
    });
  }
};
