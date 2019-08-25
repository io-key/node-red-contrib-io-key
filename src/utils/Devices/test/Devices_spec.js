const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const Devices = require('..');
const responseDevices = require('./data/response_devices.json');
const responseSensor = require('./data/response_sensor.json');

const mockSensor = {
  iokey: '123456789012345-io-key',
  name: 'AU004',
  id: '1234',
  channels: [
    '123456789012345-AU004-1-1',
    '123456789012345-AU004-1-2',
    '123456789012345-AU004-1-3',
    '123456789012345-AU004-1-4'
  ]
};

const mockIokey = {
  name: '123456789012345-io-key',
  owner: 'device_io-key-123456789012345',
  type: 'io-key4',
  sensors: [
    {
      id: '1234',
      name: 'AU004'
    }
  ]
};

describe('Class Devices', () => {
  it('fetch iokeys', async done => {
    const mock = new MockAdapter(axios);
    const devices = [mockIokey];

    mock
      .onGet(
        'https://tenant.cumulocity.com/inventory/managedObjects?fragmentType=c8y_IsDevice&pageSize=20&withTotalPages=true'
      )
      .reply(200, responseDevices);

    Devices.getIokeys('tenant.cumulocity.com', 'fakeAuth')
      .then(data => {
        expect(data).toEqual(devices);
        done();
      })
      .catch(e => {
        done.fail(e);
      });
  });

  it('fetch all sensors', async done => {
    const mock = new MockAdapter(axios);

    mock
      .onGet(
        'https://tenant.cumulocity.com/inventory/managedObjects?fragmentType=c8y_IsDevice&pageSize=20&withTotalPages=true'
      )
      .reply(200, responseDevices);

    mock
      .onGet('https://tenant.cumulocity.com/inventory/managedObjects/1234')
      .reply(200, responseSensor);

    Devices.getSensors('tenant.cumulocity.com', 'fakeAuth')
      .then(_sensors => {
        expect(_sensors).toEqual([mockSensor]);
        done();
      })
      .catch(e => done.fail(e));
  });

  it('fetch one sensor', async done => {
    const mock = new MockAdapter(axios);

    mock
      .onGet('https://tenant.cumulocity.com/inventory/managedObjects/1234')
      .reply(200, responseSensor);

    Devices.getSensorDetails('tenant.cumulocity.com', 'fakeCredentials', {
      id: '1234',
      iokey: '123456789012345-io-key'
    })
      .then(_sensor => {
        expect(_sensor).toEqual(mockSensor);
        done();
      })
      .catch(e => done.fail(e));
  });

  it('get iokeys from response', () => {
    const devicesFromResponse = Devices.getIokeysFromResponse({
      data: responseDevices
    });

    expect(devicesFromResponse[0]).toMatchObject(mockIokey);
  });

  it('get sensor from response', () => {
    const sensorFromResponse = Devices.getSensorFromResponse({
      data: responseSensor
    });
    const mockSensor = {
      name: 'AU004',
      id: '1234',
      channels: [
        '123456789012345-AU004-1-1',
        '123456789012345-AU004-1-2',
        '123456789012345-AU004-1-3',
        '123456789012345-AU004-1-4'
      ]
    };

    expect(sensorFromResponse).toEqual(mockSensor);
  });

  it('getSensors', () => {
    const iokeys = [
      {
        name: 'device_io-key-123456789012345',
        type: 'io-key4',
        sensors: [
          {
            name: 'AU004',
            id: '1234'
          },
          {
            name: 'AU004',
            id: '2345'
          }
        ]
      },
      {
        name: 'device_io-key-234567890123456',
        type: 'io-key4',
        sensors: [
          {
            name: 'AU004',
            id: '3456'
          },
          {
            name: 'AU004',
            id: '4567'
          }
        ]
      }
    ];
    const sensors = [
      {
        iokey: 'device_io-key-123456789012345',
        name: 'AU004',
        id: '1234'
      },
      {
        iokey: 'device_io-key-123456789012345',
        name: 'AU004',
        id: '2345'
      },
      {
        iokey: 'device_io-key-234567890123456',
        name: 'AU004',
        id: '3456'
      },
      {
        iokey: 'device_io-key-234567890123456',
        name: 'AU004',
        id: '4567'
      }
    ];

    expect(Devices.getSensorsFromIokeys(iokeys)).toEqual(sensors);
  });
});
