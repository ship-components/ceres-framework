const Promise = require('bluebird');
const ControllerModule = require('../../src/controllers/Controller');

describe('Controller', function() {
  let Controller;
  it('should export a function', function() {
    expect(typeof ControllerModule).toBe('function');
  });

  beforeEach(function() {
    const ctx = {};
    Controller = ControllerModule.bind(ctx, ctx);
  });

  it('should extend itself', function() {
    const example = 'test';
    const controller = new Controller({
      example,
    });
    expect(controller.example).toBe(example);
  });

  it('should have a static extend helper method', function() {
    const example = 'test';
    const controller = ControllerModule.extend({
      example,
    });
    expect(controller.example).toBe(example);
    expect(controller instanceof ControllerModule).toBeTruthy();
  });

  it('should call the init function if found', function() {
    const spy = jest.fn();
    new Controller({ // eslint-disable-line
      init: spy,
    });
    expect(spy).toHaveBeenCalled();
  });

  it('getAll should call this.model.readAll()', function() {
    const readAll = jest.fn(function() {
      return Promise.resolve();
    });
    const controller = new Controller({
      model: {
        readAll,
      },
    });
    controller.controller = controller;
    controller.getAll();
    expect(readAll).toHaveBeenCalled();
  });

  it('getOne should call this.model.read()', function() {
    const read = jest.fn(function(id) {
      return Promise.resolve(id);
    });
    const controller = new Controller({
      model: {
        read,
      },
    });
    controller.controller = controller;
    const id = 1;
    controller.getOne({
      params: {
        id,
      },
    });
    expect(read).toHaveBeenCalledWith(1);
  });

  it('getOne should call this.notFound if id is NaN', function() {
    const controller = new Controller({});
    controller.notFound = jest.fn();
    controller.getOne({
      params: {
        id: NaN,
      },
    });
    expect(controller.notFound).toHaveBeenCalled();
  });

  it('postCreate should call this.model.create()', function() {
    const create = jest.fn(function(body) {
      return Promise.resolve(body);
    });
    const controller = new Controller({
      model: {
        create,
      },
    });
    controller.controller = controller;
    const body = {
      title: 'test',
    };
    controller.postCreate({
      body,
    });
    expect(create).toHaveBeenCalledWith(body);
  });

  it('putUpdate should call this.model.update()', function() {
    const update = jest.fn(function(body) {
      return Promise.resolve(body);
    });
    const controller = new Controller({
      model: {
        update,
      },
    });
    controller.controller = controller;
    const body = {
      title: 'test',
    };
    const id = 1;
    controller.putUpdate({
      params: {
        id,
      },
      body,
    });
    expect(update).toHaveBeenCalledWith(body, id);
  });

  it('putUpdate should call this.model.updateAll() when multiple records are passed in', function() {
    const updateAll = jest.fn(function(body) {
      return Promise.resolve(body);
    });
    const controller = new Controller({
      model: {
        updateAll,
      },
    });
    controller.controller = controller;
    const body = {
      id: 1,
      title: 'test',
    };
    controller.putUpdate({
      params: {},
      body: [body],
    });
    expect(updateAll).toHaveBeenCalled();
  });

  it('deleteOne should call this.model.del()', function() {
    const controller = new Controller({
      model: {
        del() {},
      },
    });
    controller.controller = controller;

    const spy = jest.spyOn(controller.model, 'del').mockImplementation(function(id) {
      return Promise.resolve(id);
    });

    const id = 1;
    controller.deleteOne.call(controller, {
      params: {
        id,
      },
    });
    expect(spy).toHaveBeenCalledWith(id);
  });
});
