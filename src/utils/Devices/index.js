const axios = require('axios'); // TODO: Replace with fetch

/**
 * API Client to fetch io-keys and sensors
 * */
class Devices {
  /**
   * Request all sensors
   *
   * @param  {string} tenant the name of the user's tenant
   * @param  {string} credentials base64 encoded credentials
   * @returns {Promise<array>} return a list of sensors
   *
   *[{
      "iokey": "device_io-key-123456789012345",
      "name": "AU004",
      "id": "1234",
      "channels": [
        "123456789012345-AU004-1-4",
        "123456789012345-AU004-1-3",
        "123456789012345-AU004-1-2",
        "123456789012345-AU004-1-1"
      ]
    }]
   */
  static getSensors(tenant, credentials) {
    let iokeys;
    return new Promise((resolve, reject) => {
      this.getIokeys(tenant, credentials)
        .then(_iokeys => {
          iokeys = _iokeys;

          // create a request for every sensor of the io-keys
          const sensors = this.getSensorsFromIokeys(iokeys);
          const sensorRequests = sensors.map(sensor => {
            return new Promise((resolve, reject) => {
              this.getSensorDetails(tenant, credentials, sensor)
                .then(sensor => resolve(sensor))
                .catch(e => resolve([]));
            });
          });
          return Promise.all(sensorRequests);
        })
        .then(sensors => {
          resolve(sensors);
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  /**
   * Request sensor information
   *
   * @param  {string} tenant the name of the user's tenant
   * @param  {string} credentials base64 encoded credentials
   * @param  {string} sensorId the id of the sensor
   * @returns {Promise<object>} return a sensor
   * 
   * {
      "iokey": "device_io-key-123456789012345",
      "name": "AU004",
      "id": "1234",
      "channels": [
        "123456789012345-AU004-1-4",
        "123456789012345-AU004-1-3",
        "123456789012345-AU004-1-2",
        "123456789012345-AU004-1-1"
      ]
    }
   */
  static getSensorDetails(tenant, credentials, sensor) {
    return new Promise((resolve, reject) => {
      axios
        .get(`https://${tenant}/inventory/managedObjects/${sensor.id}`, {
          headers: {
            Authorization: `Basic ${credentials}`
          }
        })
        .then(response => {
          const detailedSensor = this.getSensorFromResponse(response);
          resolve({
            ...detailedSensor,
            iokey: sensor.iokey
          });
        })
        .catch(error => {
          reject();
        });
    });
  }

  /**
   * Requests all io-keys
   *
   * @param  {string} tenant the name of the user's tenant
   * @param  {string} credentials base64 encoded credentials
   * @returns {Promise<array>} return a list of all iokeys
   */
  static getIokeys(tenant, credentials, lastIokeys = [], nextUrl) {
    let url = `https://${tenant}/inventory/managedObjects?fragmentType=c8y_IsDevice&pageSize=20&withTotalPages=true`;
    if (nextUrl) url = nextUrl;

    return new Promise((resolve, reject) => {
      axios
        .get(url, {
          headers: {
            Authorization: `Basic ${credentials}`
          }
        })
        .then(response => {
          const newIokeys = this.getIokeysFromResponse(response);
          const iokeys = [...lastIokeys, ...newIokeys];

          const { next, statistics } = response.data;

          if (next && statistics.currentPage < statistics.totalPages) {
            resolve(this.getIokeys(tenant, credentials, iokeys, next));
            return;
          }

          resolve(iokeys);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Returns a sensor with all required datapoints from the http response
   *
   * @param  {object} reponse from: https://${tenant}/inventory/managedObjects/${sensorId}
   * @returns {object} return a sensor
   *
   *  {
   *    iokey: device_io-key-123456789012345,
   *    name: AU004,
   *    id: 1234,
   *    channels: [
   *      '123456789012345-AU004-1-1',
   *      '123456789012345-AU004-1-2',
   *      '123456789012345-AU004-1-3',
   *      '123456789012345-AU004-1-4'
   *    ];
   */
  static getSensorFromResponse(response) {
    const { data } = response;

    let channels = [];
    Object.keys(data).forEach(key => {
      if (key.includes('iolink_Measurement')) {
        channels.push(response.data[key].fragment);
      }
    });

    return {
      name: data.name,
      id: data.id,
      channels: channels.sort()
    };
  }

  /**
   * Returns an array of devices out of the response
   *
   * @param  {object} response from the device api https://tenant/inventory/managedObjects?fragmentType=c8y_IsDevice
   * @return {array} a list of all devices
   * 
   * [
      {
        name: 'device_io-key-12345678901',
        type: 'io-key4',
        sensors: [
          {
            id: '1234',
            name: 'AU004'
          }
        ]
      }
    ]
   */
  static getIokeysFromResponse(response) {
    return response.data.managedObjects.map(device => {
      let sensors = [];
      try {
        sensors = device.childDevices.references.map(sensor => ({
          name: sensor.managedObject.name,
          id: sensor.managedObject.id
        }));
      } catch (e) {
        sensors = [];
      }

      return {
        owner: device.owner,
        name: device.name,
        type: device.type,
        sensors
      };
    });
  }

  /**
   * Returns all sensorIds from a list of iokeys
   *
   * @param  {array} iokeys a list of iokeys
   * @return {array} a list of sensorIds
   *
   * [
   *  {
   *    iokey: 'device_io-key-123456789012345',
   *    name: 'AU004',
   *    id: '1234'
   *  },
   *  ...
   * ]
   */
  static getSensorsFromIokeys(iokeys) {
    let sensors = [];

    iokeys.forEach(iokey => {
      sensors = [
        ...sensors,
        ...iokey.sensors.map(sensor => ({
          ...sensor,
          iokey: iokey.name
        }))
      ];
    });

    return sensors;
  }
}

module.exports = Devices;
