const Promise = require('bluebird');
const ControllerModule = require('../../src/controllers/Controller');

describe('Controller', () => {
  let Controller;
  it('should export a function', () => {
    expect(typeof ControllerModule).toBe('function');
  });

  beforeEach(() => {
    const ctx = {};
    Controller = ControllerModule.bind(ctx, ctx);
  });

  it('should extend itself', () => {
    const example = 'test';
    const controller = new Controller({
      example,
    });
    expect(controller.example).toBe(example);
  });

  it('should have a static extend helper method', () => {
    const example = 'test';
    const controller = ControllerModule.extend({
      example,
    });
    expect(controller.example).toBe(example);
    expect(controller instanceof ControllerModule).toBeTruthy();
  });

  it('should call the init function if found', () => {
    const spy = jest.fn();
    Controller({
      init: spy,
    });
    expect(spy).toHaveBeenCalled();
  });

  it('getAll should call this.model.readAll()', () => {
    const readAll = jest.fn(() => {
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

  it('getOne should call this.model.read()', () => {
    const read = jest.fn(id => {
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

  it('getOne should call this.notFound if id is NaN', () => {
    const controller = new Controller({});
    controller.notFound = jest.fn();
    controller.getOne({
      params: {
        id: NaN,
      },
    });
    expect(controller.notFound).toHaveBeenCalled();
  });

  it('postCreate should call this.model.create()', () => {
    const create = jest.fn(body => {
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

  it('putUpdate should call this.model.update()', () => {
    const update = jest.fn(body => {
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

  it('putUpdate should call this.model.updateAll() when multiple records are passed in', () => {
    const updateAll = jest.fn(body => {
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

  it('deleteOne should call this.model.del()', () => {
    const controller = new Controller({
      model: {
        del() {},
      },
    });
    controller.controller = controller;

    const spy = jest.spyOn(controller.model, 'del').mockImplementation(id => {
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
