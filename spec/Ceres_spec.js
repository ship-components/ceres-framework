const Ceres = require('../src/Ceres');
const instance = require('../src/index');

describe('Ceres', function() {
  it('should export a singlton instance', function() {
    expect(instance instanceof Ceres).toBeTruthy();
  });

  it('should have an exec method', function() {
    expect(typeof Ceres.prototype.exec).toEqual('function');
  });

  it('should have an load method', function() {
    expect(typeof Ceres.prototype.load).toEqual('function');
  });
});
