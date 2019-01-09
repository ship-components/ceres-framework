/**
 * Recursive object copy
 *
 * @param     {Mixed}    obj
 * @return    {Mixed}
 */
module.exports = function deepCopy(obj) { // eslint-disable-line complexity
  var copy;

  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = deepCopy(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepCopy(obj[key]);
      }
    }

    return copy;
  }

  throw new Error('Unable to copy obj! Its type is not supported.');
};
