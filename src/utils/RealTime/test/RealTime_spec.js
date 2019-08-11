const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const RealTime = require('..');

const responseHandshake = require('./data/response_handshake');
const responseSubscribe = require('./data/response_subscribe');
const responseConnect = require('./data/response_connect');
const responseDisconnect = require('./data/response_disconnect');
const responseExpiredSession = require('./data/response_expiredSession');

const node = {
  id: 'n1',
  on: () => {},
  type: 'measurements',
  send: jest.fn(msg => {}),
  status: jest.fn(status => {}),
  error: jest.fn(() => {})
};
const config = {
  iokey: 'iokey1',
  sensor: '1234',
  channel: '123456789012345-AL002-1-1'
};
const auth = {
  tenant: 'tenant.cumulocity.com',
  username: 'tester@test.com',
  password: 'password'
};

describe('Class Realtime', () => {
  it('instantiate class', () => {
    const realTime = new RealTime(node, config, auth);

    expect(realTime.node).toEqual(node);
    expect(realTime.config).toEqual(config);
    expect(realTime.credentials).toEqual(
      'dGVuYW50L3Rlc3RlckB0ZXN0LmNvbTpwYXNzd29yZA=='
    );
    expect(realTime.clientId).toEqual('');
    expect(realTime.connected).toEqual(false);
    expect(realTime.STATUS_TYPES).toBeDefined();
  });

  it('it should not start with invalid credentials', () => {
    const realTime = new RealTime(node, config, {
      tenant: 'tenant.cumulocity.com',
      username: '',
      password: ''
    });

    realTime.setStatus = jest.fn();
    realTime.start();
    expect(realTime.setStatus).toHaveBeenCalledWith(
      realTime.STATUS_TYPES.MISSING_CREDENTIALS
    );
  });

  it('should fail to subscribe with invalid sensor', async done => {
    const realTime = new RealTime(
      node,
      {
        iokey: 'iokey1',
        sensor: '1234',
        channel: ''
      },
      auth
    );
    realTime.setStatus = jest.fn();
    realTime
      .subscribeChannel()
      .then(() => {
        done.fail();
      })
      .catch(e => {
        expect(realTime.setStatus).toHaveBeenCalledWith(
          realTime.STATUS_TYPES.INVALID_SENSOR
        );
        done();
      });
  });

  it('it should start', () => {
    const realTime = new RealTime(node, config, auth);
    realTime.setStatus = jest.fn();
    realTime.handshakeSession = jest.fn(
      () => new Promise((resolve, reject) => resolve())
    );

    realTime.start();
    expect(realTime.setStatus).toHaveBeenCalledTimes(1);
    expect(realTime.handshakeSession).toHaveBeenCalledTimes(1);
  });

  it('should successfully handshake session', done => {
    const clientId = '13bp016pv6vdsqxz8p';
    const mock = new MockAdapter(axios);
    mock
      .onPost(`https://tenant.cumulocity.com/cep/realtime`)
      .reply(200, responseHandshake);

    const realTime = new RealTime(node, config, auth);
    realTime
      .handshakeSession()
      .then(() => {
        // "realtime" should have a valid clientId property after this request
        expect(realTime.clientId).toEqual(clientId);

        return realTime.disconnect();
      })
      .then(() => done())
      .catch(e => {
        done.fail(e);
      });
  });

  it('should fail to handshake session', done => {
    const mock = new MockAdapter(axios);
    mock.onPost(`https://tenant.cumulocity.com/cep/realtime`).reply(401, {});

    const realTime = new RealTime(node, config, auth);
    realTime
      .handshakeSession()
      .then(() => {
        done.fail(new Error('Should have failed'));
      })
      .catch(e => {
        expect(e.response.status).toEqual(401);
        done();
      });
  });

  it('should successfully subscribe channel', done => {
    const mock = new MockAdapter(axios);
    mock
      .onPost(`https://tenant.cumulocity.com/cep/realtime`)
      .reply(200, responseSubscribe);

    const realTime = new RealTime(node, config, auth);
    realTime
      .subscribeChannel()
      .then(() => done())
      .catch(e => {
        done.fail(e);
      });
  });

  it('should fail to subscribe channel', done => {
    const mock = new MockAdapter(axios);
    mock.onPost(`https://tenant.cumulocity.com/cep/realtime`).reply(401, {});

    const realTime = new RealTime(node, config, auth);
    realTime
      .handshakeSession()
      .then(() => {
        done.fail(new Error('Should have failed'));
      })
      .catch(e => {
        expect(e.response.status).toEqual(401);
        done();
      });
  });

  it('should successfully connect', done => {
    const mock = new MockAdapter(axios);
    mock
      .onPost(`https://tenant.cumulocity.com/cep/realtime`)
      .reply(200, responseConnect);

    const realTime = new RealTime(node, config, auth);
    realTime
      .connect()
      .then(messages => {
        expect(messages).toEqual(responseConnect);
        done();
      })
      .catch(e => {
        done.fail(e);
      });
  });

  it('should fail to connect', done => {
    const mock = new MockAdapter(axios);
    mock.onPost(`https://tenant.cumulocity.com/cep/realtime`).reply(401, {});

    const realTime = new RealTime(node, config, auth);
    realTime.handleConnectionFail = jest.fn();
    realTime
      .connect()
      .then(() => {
        done.fail();
      })
      .catch(e => {
        expect(e.response.status).toEqual(401);
        done();
      });
  });

  it('should successfully disconnect', done => {
    const mock = new MockAdapter(axios);
    mock
      .onPost(`https://tenant.cumulocity.com/cep/realtime`)
      .reply(200, responseDisconnect);

    const realTime = new RealTime(node, config, auth);
    realTime
      .disconnect()
      .then(() => {
        // "realtime" should have a valid clientId property after this request
        expect(realTime.connected).toEqual(false);

        done();
      })
      .catch(e => {
        done.fail(e);
      });
  });

  it('should send message', () => {
    const realTime = new RealTime(node, config, auth);
    realTime.handleNewMessage(responseConnect);

    expect(realTime.node.send).toHaveBeenCalledWith({
      payload: {
        type: '123456789012345-AL002-1-1',
        time: '2019-07-29T09:32:28.187Z',
        series: 'Series-837-39',
        value: 65,
        unit: null,
        source: '1234'
      }
    });
  });

  it('should start a new connection', () => {
    const realTime = new RealTime(node, config, auth);
    realTime.connected = true;
    realTime.connect = jest.fn(
      () => new Promise((resolve, reject) => resolve())
    );
    realTime.startNewConnection();

    expect(realTime.connect).toHaveBeenCalled();
  });

  it('should handle an expired session', () => {
    const mock = new MockAdapter(axios);
    mock
      .onPost(`https://tenant.cumulocity.com/cep/realtime`)
      .reply(200, responseExpiredSession);

    const realTime = new RealTime(node, config, auth);
    realTime.handleExpiredSession = jest.fn();

    realTime.handleNewMessage(responseExpiredSession);

    expect(realTime.handleExpiredSession).toHaveBeenCalled();
  });

  it('should restart after an expired session was detected', () => {
    const realTime = new RealTime(node, config, auth);
    realTime.start = jest.fn(() => new Promise((resolve, reject) => resolve()));

    realTime.handleExpiredSession();

    expect(realTime.start).toHaveBeenCalled();
  });

  it('should not start a new connection after fail', () => {
    const realTime = new RealTime(node, config, auth);
    realTime.setStatus = jest.fn();
    realTime.disconnect = jest.fn(
      () => new Promise((resolve, reject) => resolve())
    );

    realTime.handleConnectionFail({ response: { status: 401 } });

    expect(realTime.setStatus).toHaveBeenCalled();
    expect(realTime.disconnect).toHaveBeenCalled();
  });

  it('sould start a new connection after 5 seconds', () => {
    jest.useFakeTimers();

    const realTime = new RealTime(node, config, auth);
    realTime.startNewConnection = jest.fn();

    realTime.handleConnectionFail();

    // At this point in time, the callback should not have been called yet
    expect(realTime.startNewConnection).not.toBeCalled();

    // Fast-forward until all timers have been executed
    jest.runAllTimers();

    // Now our callback should have been called!
    expect(realTime.startNewConnection).toBeCalled();
    expect(realTime.startNewConnection).toHaveBeenCalledTimes(1);
  });

  it('should not start a new connection', () => {
    const realTime = new RealTime(node, config, auth);
    realTime.connected = false;
    realTime.connect = jest.fn(
      () => new Promise((resolve, reject) => resolve())
    );
    realTime.startNewConnection();

    expect(realTime.connect).not.toHaveBeenCalled();
  });

  it('should set status', () => {
    const node = { status: jest.fn(), on: jest.fn() };
    const realTime = new RealTime(node, config, auth);

    realTime.setStatus(realTime.STATUS_TYPES.MISSING_CREDENTIALS);
    realTime.setStatus(realTime.STATUS_TYPES.INVALID_CREDENTIALS);
    realTime.setStatus(realTime.STATUS_TYPES.INVALID_SENSOR);
    realTime.setStatus(realTime.STATUS_TYPES.CONNECTING);
    realTime.setStatus(realTime.STATUS_TYPES.CONNECTED);
    realTime.setStatus(realTime.STATUS_TYPES.CONNECTION_FAILED);
    realTime.setStatus();

    expect(realTime.node.status).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Missing Credentials' })
    );
    expect(realTime.node.status).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Invalid Credentials' })
    );
    expect(realTime.node.status).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'No valid Sensor selected' })
    );
    expect(realTime.node.status).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Connecting...' })
    );
    expect(realTime.node.status).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Connected' })
    );
    expect(realTime.node.status).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Failed to establish connection' })
    );
    expect(realTime.node.status).toHaveBeenCalledTimes(7);
  });

  it('should validate sensor', () => {
    const realTime = new RealTime(node, config, auth);
    realTime.config.sensor = 'abc';
    realTime.config.channel = '123';
    expect(realTime.validateSensor()).toBeTruthy();

    realTime.config.sensor = '';
    realTime.config.channel = '123';
    expect(realTime.validateSensor()).toBeFalsy();

    realTime.config.sensor = 'abc';
    realTime.config.channel = '';
    expect(realTime.validateSensor()).toBeFalsy();

    realTime.config.sensor = '';
    realTime.config.channel = '';
    expect(realTime.validateSensor()).toBeFalsy();
  });
});
