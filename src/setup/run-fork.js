var Promise = require('bluebird');
var fork = require('child_process').fork;

var Server = require('./Server');
var Pid = require('../lib/Pid');
var logStartTime = require('../lib/logStartTime');

/**
 * Unique id of each child process
 * @type    {Number}
 */
var uniqueIds = 0;

/**
 * Active child processes
 * @type    {Array}
 */
var workers = [];

/**
 * Fork the application and run it on a specific port. Recursively spawn a new
 * intsance if it crashes
 * @param    {Object}    ceres    [description]
 * @param    {Number}    port     [description]
 * @return   {Undefined}
 */
function spawn(ceres, port) {
	var worker = fork('./home-run.js', process.argv, {
		env: {
			PORT: port,
			CERES_UNIQUE_ID: ++uniqueIds
		}
	});

	worker.on('exit', function(code, signal){
		ceres.log._ceres.error('%s - Spawning new process', worker.pid, code || signal);

		var index = workers.indexOf(worker);
		if (index !== -1) {
			workers.splice(index, 1);
		}

		// Wait a second so we don't spam restarts
		setTimeout(function(){
			spawn(ceres, port);
		}, 1000);
	});

	workers.push(worker);
}

/**
 * Setup and start listening
 * @param  {Ceres} ceres
 * @return {Promise}
 */
function listen(ceres) {
	return new Promise(function(resolve, reject){
		try {
			ceres.log._ceres.silly('CERES_UNIQUE_ID=%s', process.env.CERES_UNIQUE_ID);
			Server.call(ceres, ceres).listen(ceres.config.port, function(){
				logStartTime('Child took %ds to start listening', ceres);
				ceres.log._ceres.info('Listening on %d (%s)', ceres.config.port, ceres.config.env);
				resolve();
			});
		} catch(err) {
			reject(err);
		}
	});
}

/**
 * Make sure everything is setup the way we need to be before we start Listening
 * @param  {Ceres}    ceres
 * @return {Promise}
 */
module.exports = function(ceres) {
	return new Promise(function(resolve, reject){
		// CERES_UNIQUE_ID gets automatically assigned to children
		var isMaster = !process.env.CERES_UNIQUE_ID;

		if (isMaster && ceres.config.pid) {
			// Setup Pid for the master process
			ceres.pid = new Pid(ceres.config.pid);
			ceres.log._ceres.silly('pid %d written to %s', ceres.pid.id, ceres.pid.options.path);
		}

		if (isMaster) {
			// Master

			// Ensure we always have an array
			var ports = ceres.config.port instanceof Array ? ceres.config.port : [ceres.config.port];

			ceres.log._ceres.debug('Master forking %d instances - %s', ports.length, ports.join(', '));
			for (var i = 0; i < ports.length; i++) {
				spawn(ceres, ports[i]);
			}
			resolve();
		} else {
			// Child
			ceres.connect.call(ceres, ceres)
				.then(listen.bind(ceres, ceres))
				.then(resolve)
				.catch(reject);
		}
	});
};
