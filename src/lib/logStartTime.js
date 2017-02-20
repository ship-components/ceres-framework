var moment = require('moment');

/**
 * Log the time it took to start
 * @param  {String} str
 * @param  {Ceres}  ceres
 */
module.exports = function logStartTime(str, ceres) {
		// Calculate how long it took to load
		ceres.loadTime = process.hrtime(ceres.startTime);
		var loadTimeMs = Math.floor((ceres.loadTime[0] * 1e9 + ceres.loadTime[1]) / 1000000);
		var loadTimes = moment.duration(loadTimeMs).asSeconds();
		// Log it
		ceres.log._ceres.debug(str, loadTimes);
};
