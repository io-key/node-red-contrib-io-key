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
          const sensorIds = this.getSensorIdsFromIokeys(iokeys);
          const sensorRequests = sensorIds.map(sensorId => {
            return new Promise((resolve, reject) => {
              this.getSensor(tenant, credentials, sensorId)
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
  static getSensor(tenant, credentials, sensorId) {
    return new Promise((resolve, reject) => {
      axios
        .get(`https://${tenant}/inventory/managedObjects/${sensorId}`, {
          headers: {
            Authorization: `Basic ${credentials}`
          }
        })
        .then(response => {
          const sensor = this.getSensorFromResponse(response);
          resolve(sensor);
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
  static getIokeys(tenant, credentials) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `https://${tenant}/inventory/managedObjects?fragmentType=c8y_IsDevice`,
          {
            headers: {
              Authorization: `Basic ${credentials}`
            }
          }
        )
        .then(response => {
          const iokeys = this.getIokeysFromResponse(response);
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
      iokey: data.owner,
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
        name: device.owner,
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
   * ["1234","2345","3456","4567"]
   */
  static getSensorIdsFromIokeys(iokeys) {
    let sensorsIds = [];

    iokeys.forEach(iokey => {
      sensorsIds = [...sensorsIds, ...iokey.sensors.map(({ id }) => id)];
    });

    return sensorsIds;
  }
}

module.exports = Devices;
