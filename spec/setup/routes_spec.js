const express = require('express');
const setupRoutes = require('../../src/setup/routes');
const TestController = require('../helpers/TestController');

describe('routes', () => {
  let ceres;
  let ran = false;

  beforeEach(() => {
    ran = false;
    // Setup mock router
    TestController.router = () => {
      ran = true;
      return new express.Router();
    };

    ceres = {
      log: {
        internal: {
          silly() {},
          error: console.error,
        },
      },
      config: {
        cache: false,
        folders: {
          controllers: '.',
        },
      },
    };
  });

  it('should call the router function on controller', () => {
    ceres.config.controllers = {
      './spec/helpers/TestController': '/',
    };
    const router = setupRoutes(ceres, 'controllers');
    expect(typeof router).toBe('function');
    expect(ran).toBe(true);
  });
});
