const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const helper = require('node-red-node-test-helper');
const measurements = require('../measurements');
const tenantConfig = require('../../tenant-config/tenant-config');

const flow = [
  {
    id: 'f1',
    type: 'tab',
    label: 'Flow 1',
    disabled: false,
    info: ''
  },
  {
    id: 'n1',
    type: 'measurements',
    z: 'f1',
    name: 'AU004',
    auth: 'nc',
    device: 'iokey1',
    sensor: '1234',
    channel: '1',
    format: 'none',
    x: 110,
    y: 100,
    wires: [[]]
  },
  {
    id: 'nc',
    type: 'tenant-config',
    z: ''
  }
];

helper.init(require.resolve('node-red'));

describe('measurements Node', () => {
  beforeEach(done => {
    helper.startServer(done);
  });

  afterEach(done => {
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', done => {
    const mock = new MockAdapter(axios);
    mock.onPost('https://tenant.cumulocity.com/cep/realtime').reply(200, {});

    helper.load([measurements, tenantConfig], flow, () => {
      const nc = helper.getNode('nc');
      nc.tenant = 'tenant.cumulocity.com';
      nc.username = 'tester@test.com';
      nc.password = '1234';

      const n1 = helper.getNode('n1');

      expect(n1).toHaveProperty('name', 'AU004');
      done();
    });
  });
});
