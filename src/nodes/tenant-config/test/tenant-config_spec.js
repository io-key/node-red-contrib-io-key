const axios = require('axios');
const helper = require('node-red-node-test-helper');
const MockAdapter = require('axios-mock-adapter');
const tenantConfig = require('../tenant-config');
const Credentials = require('../../../utils/Credentials');

const responseDevices = require('../../../utils/Devices/test/data/response_devices');
const responseSensor = require('../../../utils/Devices/test/data/response_sensor');
const responseLoginOptions = require('../../../utils/Credentials/test/data/response_loginOptions');

helper.init(require.resolve('node-red'));

const flow = [
  {
    id: 'nc',
    type: 'tenant-config',
    z: '',
    name: 'My credentials'
  }
];

const mockSensors = [
  {
    iokey: 'device_io-key-123456789012345',
    name: 'AU004',
    id: '1234',
    channels: [
      '123456789012345-AU004-1-1',
      '123456789012345-AU004-1-2',
      '123456789012345-AU004-1-3',
      '123456789012345-AU004-1-4'
    ]
  }
];

describe('tenant config node', () => {
  beforeEach(done => {
    helper.startServer(done);
  });

  afterEach(function(done) {
    helper.unload().then(function() {
      helper.stopServer(done);
    });
  });

  it('should be loaded', done => {
    helper.load(tenantConfig, flow, () => {
      const nc = helper.getNode('nc');
      expect(nc).toHaveProperty('name', 'My credentials');
      done();
    });
  });

  it('should return devices', async done => {
    const mock = new MockAdapter(axios);
    mock
      .onGet(
        'https://tenant.cumulocity.com/inventory/managedObjects?fragmentType=c8y_IsDevice'
      )
      .reply(200, responseDevices);

    mock
      .onGet('https://tenant.cumulocity.com/inventory/managedObjects/1234')
      .reply(200, responseSensor);

    mock
      .onGet('https://tenant.cumulocity.com/tenant/loginOptions')
      .reply(200, responseLoginOptions);

    helper.load(tenantConfig, flow, () => {
      const nc = helper.getNode('nc');

      nc.tenant = 'tenant.cumulocity.com';
      nc.username = 'tester@test.com';
      nc.password = '1234';

      nc.c = new Credentials({
        tenant: 'tenant.cumulocity.com',
        username: 'tester@test.com',
        password: '1234'
      });

      helper
        .request()
        .get('/iokeys/sensors')
        .expect(200)
        .end((err, res) => {
          const sensors = res.body;
          expect(sensors).toEqual(mockSensors);
          done();
        });
    });
  });

  it('should not return devices', async done => {
    const mock = new MockAdapter(axios);
    mock
      .onGet(
        'https://tenant.cumulocity.com/inventory/managedObjects?fragmentType=c8y_IsDevice'
      )
      .reply(401, responseDevices);

    mock
      .onGet('https://tenant.cumulocity.com/inventory/managedObjects/1234')
      .reply(200, responseSensor);

    helper.load(tenantConfig, flow, () => {
      helper
        .request()
        .get('/iokeys/sensors')
        .expect(200)
        .end((err, res) => {
          if (err) {
            done.fail(err);
          } else {
            expect(res.body.code).toEqual('unexpected_error');
            done();
          }
        });
    });
  });
});
