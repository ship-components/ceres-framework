const Ceres = require('../src/Ceres');
const instance = require('../src/index');

describe('Ceres', () => {
  it('should export a singlton instance', () => {
    expect(instance instanceof Ceres).toBeTruthy();
  });

  it('should have an exec method', () => {
    expect(typeof Ceres.prototype.exec).toEqual('function');
  });

  it('should have an load method', () => {
    expect(typeof Ceres.prototype.load).toEqual('function');
  });
});
