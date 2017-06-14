/**
 * Common errors and how to detect them
 * @type    {Array}
 */
var CommonErrors = [
	{
		message: /^Forbidden:?(.+)?/,
		status: 401,
		level: 'warn',
		defaultText: 'Please login first'
	},
	{
		message: /^Permission\s?Denied:?(.+)?/,
		status: 403,
		level: 'warn',
		defaultText: 'You do not have permission to access this.'
	},
	{
		message: /^Not\s?Found:?(.+)?/,
		status: 404,
		level: 'warn',
		defaultText: 'Unable to find resource'
	},
	{
		message: /^Bad\s?Request:?(.+)?/,
		status: 400,
		level: 'warn',
		defaultText: 'Bad Request'
	},
	{
		code: /^EBADCSRFTOKEN$/,
		status: 400,
		level: 'warn',
		defaultText: 'Bad Token'
	}
];

/**
 * Parse the error and see if its a common error. If it's common we'll probably
 * change the response status
 * @param    {Error}    err
 * @return   {Object}
 */
function findCommonError(err, Ceres) {
	// Attempt to match some common errors so we can apply the right status
	return CommonErrors.map(function(commonError){
		for (var key in commonError) {
			if (!commonError.hasOwnProperty(key)) {
				continue;
			} else if (err[key] && commonError[key] instanceof RegExp && commonError[key].test(err[key])) {
				// Attempt to grab some additional info from the commonError message
				var parts = err[key].match(commonError[key]);
				Ceres.log.silly('[ErrorHandler] Matched %s - error.message.%s like %s', commonError.defaultText, key, commonError[key].toString(), parts);
				return {
					message: parts[1] && parts[1].trim().length > 0 ? parts[1].trim() : commonError.defaultText,
					status: commonError.status
				};
			} else if (err[key] && commonError[key] === err[key] && ['level', 'defaultText'].indexOf(key) === -1) {
				Ceres.log.silly('[ErrorHandler] Matched %s - error.%s = %s', commonError.defaultText, key, err[key]);
				// Match other values like `code`
				return {
					message: commonError.defaultText,
					status: commonError.status
				};
			}
		}
		return;
	}).find(function(error){
		return typeof error === 'object';
	});
}

module.exports = function(Ceres) {
	return function(err, req, res, next){ // eslint-disable-line no-unused-vars
		/**
		 * Default response
		 * @type    {Object}
		 */
		var response = {
			status: 500,
			message: err.message
		};

		// For development pass the stack along
		if (Ceres.config.env !== 'production' && err instanceof Error) {
			response.stack = err.stack.split('\n');
		}

		// Attempt to match some common errors so we can apply the right status
		var commonErrorResponse = findCommonError(err, Ceres);
		if (commonErrorResponse) {
			Object.assign(response, commonErrorResponse);
		}

		// Make sure to log it
		if (typeof Ceres.log[response.level] === 'function') {
			// We set common errors to warnings to make them easier to filter later
			Ceres.log[response.level](req.method, req.originalUrl, err);
		} else {
			Ceres.log.error(req.method, req.originalUrl, err);
		}

		// Headers already sent so we can't end anything else
		if (res.headerSent) {
			return;
		}

		// Set the http status
		res.status(response.status);

		if (typeof req.headers.accept === 'string' && req.headers.accept.match(/application\/json|\*\/\*/i)) {
			// Json response if the client accepts it
			res.json(response).end();
      return;
		}

		var html = '<html>';
		html += '<head>';
		html += '<title>' + response.message + '</title>';
		html += '<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/ionic/1.3.2/css/ionic.min.css" />';
		html += '</head>';
		html += '<body style="padding: 24px;">';
		html += '<h1>' + Ceres.config.name + ': ' + response.message + '</h1>';
		if (Ceres.config.env !== 'production' && response.stack) {
			html += '<pre>' + response.stack.join('\n') + '</pre>';
		}
		html += '</html>';
		res.send(html).end();
	};
};
