/**
 * Common errors and how to detect them
 * @type    {Array}
 */
var CommonErrors = [
	{
		code: /^EBADCSRFTOKEN$/,
		status: 400,
		level: 'warn',
		defaultText: 'Bad Token'
	},
	{
		message: /^Forbidden:?(.*)/,
		status: 401,
		level: 'warn',
		defaultText: 'Please login first'
	},
	{
		message: /^Permission\s?Denied:?(.*)/,
		status: 403,
		level: 'warn',
		defaultText: 'You do not have permission to access this.'
	},
	{
		message: /^Not\s?Found:?(.*)/,
		status: 404,
		level: 'warn',
		defaultText: 'Unable to find resource'
	},
	{
		message: /^Bad\s?Request:?(.*)/,
		status: 400,
		level: 'warn',
		defaultText: 'Bad Request'
	}
];

/**
 * Parse the error and see if its a common error. If it's common we'll probably
 * change the response status
 * @param    {Error}    err
 * @return   {Object}
 */
function findCommonError(err) {
	// Attempt to match some common errors so we can apply the right status
	return CommonErrors.map(function(commonError){
		for (var key in commonError) {
			if (!commonError.hasOwnProperty(key)) {
				continue;
			} else if (err[key] && commonError[key] instanceof RegExp && commonError[key].test(err[key])) {
				// Attempt to grab some additional info from the commonError message
				var parts = err[key].match(commonError[key]);
				return {
					message: parts[1].trim().length > 0 ? parts[1].trim() : commonError[key].defaultText,
					status: commonError[key].status
				};
			} else if (err[key] && commonError[key] === err[key] && ['level', 'defaultText'].indexOf(key) === -1) {
				// Match other values like `code`
				return {
					message: commonError[key].defaultText,
					status: commonError[key].status
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
		var commonErrorResponse = findCommonError(err);
		if (commonErrorResponse) {
			Object.assign(response, commonErrorResponse);
		}

		// Make sure to log it
		if (typeof Ceres.log[response.level] === 'function') {
			// We set common errors to warnings to make them easier to filter later
			Ceres.log[response.level](err);
		} else {
			Ceres.log.error(err);
		}

		// Set the http status
		res.status(response.status);

		if (req.headers.accept.indexOf('application/json') > -1) {
			// Json response if the client accepts it
			res.json(response).end();
		} else if (Ceres.config.env !== 'production' && response.stack) {
			// Dev response
			res.send(
				'<h1>' + response.message + '</h1>' +
				'<pre>' + response.stack.join('\n') + '</pre>'
			).end();
		} else {
			// Default html response
			res.send(
				'<h1>' + response.message + '</h1>'
			).end();
		}
	};
};
