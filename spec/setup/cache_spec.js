var setupCache = require('../../src/setup/cache');

describe('cache', function(){
	var ceres = {
		logger: function(){
			return {
				debug: function(){}
			};
		},
		config: {
			cache: false
		}
	};

	it('should return a promise with the cache as the result', function(done){
		setupCache(ceres).then(function(cache){
			expect(cache).not.toBeDefined();
			done();
		});
	});
});
