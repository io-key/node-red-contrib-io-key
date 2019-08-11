const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const Devices = require('..');
const responseDevices = require('./data/response_devices.json');
const responseSensor = require('./data/response_sensor.json');

const mockSensor = {
  iokey: 'device_io-key-123456789012345',
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
  name: 'device_io-key-123456789012345',
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
        'https://tenant.cumulocity.com/inventory/managedObjects?fragmentType=c8y_IsDevice'
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
        'https://tenant.cumulocity.com/inventory/managedObjects?fragmentType=c8y_IsDevice'
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

    Devices.getSensor('tenant.cumulocity.com', 'fakeAuth', '1234')
      .then(_sensor => {
        expect(_sensor).toEqual(mockSensor);
        done();
      })
      .catch(e => done.fail(e));
  });

  it('get devices from response', () => {
    const devicesFromResponse = Devices.getIokeysFromResponse({
      data: responseDevices
    });

    expect(devicesFromResponse[0]).toMatchObject(mockIokey);
  });

  it('get sensor from response', () => {
    const sensorFromResponse = Devices.getSensorFromResponse({
      data: responseSensor
    });

    expect(sensorFromResponse).toEqual(mockSensor);
  });

  it('getSensorsIds', () => {
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
    const sensorIds = ['1234', '2345', '3456', '4567'];

    expect(Devices.getSensorIdsFromIokeys(iokeys)).toEqual(sensorIds);
  });
});
