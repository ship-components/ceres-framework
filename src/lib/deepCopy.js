/**
 * Recursive object copy
 *
 * @param     {Mixed}    obj
 * @return    {Mixed}
 */
module.exports = function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  var src = obj instanceof Array ? [] : {};
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      src[key] = deepCopy(obj[key]);
    }
  }
  return src;
};
