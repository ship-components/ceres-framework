const assertNotNull = require('../../src/lib/assert').assertNotNull;
const assertDefined = require('../../src/lib/assert').assertDefined;

describe('assert', () => {
  describe('assertNotNull', () => {
    it('should throw an error when a value is null', () => {
      expect(function() {
        // eslint-disable-line
        assertNotNull(null);
      }).toThrow();
    });

    it('should not throw an error when a value is not null', () => {
      expect(function() {
        // eslint-disable-line
        assertNotNull('');
        assertNotNull(1);
        assertNotNull({});
        assertNotNull([]);
        assertNotNull(function() {}); // eslint-disable-line
      }).not.toThrow();
    });
  });

  describe('assertDefined', () => {
    it('should throw an error when a value is not defined', () => {
      expect(function() {
        // eslint-disable-line
        assertDefined(void 0);
      }).toThrow();
    });

    it('should not throw an error when a value is defined', () => {
      expect(function() {
        // eslint-disable-line
        assertDefined('');
        assertDefined(1);
        assertDefined({});
        assertDefined([]);
        assertDefined(function() {}); // eslint-disable-line
      }).not.toThrow();
    });
  });
});
