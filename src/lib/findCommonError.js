/**
 * Common errors and how to detect them
 * @type    {Array}
 */
const CommonErrors = [
  {
    message: /^Forbidden:?(.+)?/i,
    status: 401,
    level: 'warn',
    defaultText: 'Please login first',
  },
  {
    message: /^Permission\s?Denied:?(.+)?/i,
    status: 403,
    level: 'warn',
    defaultText: 'You do not have permission to access this.',
  },
  {
    message: /^Not\s?Found:?(.+)?/i,
    status: 404,
    level: 'warn',
    defaultText: 'Unable to find resource',
  },
  {
    message: /^Bad\s?Request:?(.+)?/i,
    status: 400,
    level: 'warn',
    defaultText: 'Bad Request',
  },
  {
    code: /^EBADCSRFTOKEN$/,
    status: 400,
    level: 'warn',
    defaultText: 'Bad Token',
  },
];

module.exports.CommonErrors = CommonErrors;

/**
 * Parse the error and see if its a common error. If it's common we'll probably
 * change the response status
 * @param    {Error}    err
 * @param    {object?}   logger
 * @return   {Object}
 */
module.exports.findCommonError = function findCommonError(err, logger = undefined) {
  // Attempt to match some common errors so we can apply the right status
  return CommonErrors.map(commonError => {
    const keys = Object.keys(commonError);
    for (let k = 0; k < keys.length; k += 1) {
      const key = keys[k];
      if (err[key] && commonError[key] instanceof RegExp && commonError[key].test(err[key])) {
        // Attempt to grab some additional info from the commonError message
        const parts = err[key].match(commonError[key]);
        if (logger) {
          logger.silly(
            '[ErrorHandler] Matched %s - error.message.%s like %s',
            commonError.defaultText,
            key,
            commonError[key].toString(),
            parts
          );
        }
        return Object.assign({}, commonError, {
          message:
            parts[1] && parts[1].trim().length > 0 ? parts[1].trim() : commonError.defaultText,
          status: commonError.status,
        });
      }
      if (
        err[key] &&
        commonError[key] === err[key] &&
        ['level', 'defaultText'].indexOf(key) === -1
      ) {
        if (logger) {
          logger.silly(
            '[ErrorHandler] Matched %s - error.%s = %s',
            commonError.defaultText,
            key,
            err[key]
          );
        }
        // Match other values like `code`
        return Object.assign({}, commonError, {
          message: commonError.defaultText,
          status: commonError.status,
        });
      }
    }
    return null;
  }).find(error => typeof error === 'object' && error != null);
};
