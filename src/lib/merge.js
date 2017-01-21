/**
 * Deeply merge objects together
 * @param    {[Object]}  Any number of arguments
 * @return   {Object}
 */
module.exports = function merge() {
  var args = Array.prototype.slice.call(arguments);
  var result = args.shift();
  if (typeof result !== 'object') {
    // Ensure result is an object we can assign to
    result = {};
  }
  args.forEach(function(src){
    // Ignore if not an object
    if (typeof src !== 'object') {
      return;
    }
    Object.keys(src).forEach(function(key){
      if (typeof src[key] === 'object' && src[key] instanceof Array !== true) {
        // Recursion
        result[key] = merge({}, result[key], src[key]);
      } else if (typeof src[key] !== 'undefined') {
        // Copy any value that is defined, ignore undefined
        result[key] = src[key];
      }
    });
  });
  return result;
};
