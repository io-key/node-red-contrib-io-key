const axios = require('axios');
const Credentials = require('../Credentials');
const Measurement = require('../Measurement');
const Alarm = require('../Alarm');
const Event = require('../Event');

/**
 * Connects to cumulocity's realtime-notification API
 * */
class RealTime {
  constructor(node, config, auth) {
    this.node = node;
    this.config = config;
    this.auth = auth;
    this.tenantId = '';
    this.credentials = new Credentials(auth);
    this.encodedCredentials = '';

    this.clientId = '';
    this.connected = false;

    /**
     * Constants to describe all status types of the node
     * */
    this.STATUS_TYPES = {
      MISSING_CREDENTIALS: 'missingCredentials',
      INVALID_CREDENTIALS: 'invalidCredentials',
      INVALID_SENSOR: 'invalidSensor',
      CONNECTING: 'connecting',
      CONNECTED: 'connected',
      CONNECTION_FAILED: 'connection_failed'
    };

    this.ERROR_TYPES = {
      HANDSHAKE_FAILED: 'handshake_failed',
      SUBSCRIPTION_FAILED: 'subscribtion_failed',
      BAD_CRENETIALS: 'bad_credentials'
    };

    node.on('close', () => {
      this.disconnect();
    });
  }

  /**
   * Starts a session, subscribe to a channel and then connects to receive data
   */
  start() {
    if (!Credentials.validateCredentials(this.auth)) {
      this.setStatus(this.STATUS_TYPES.MISSING_CREDENTIALS);
      return;
    }

    this.setStatus(this.STATUS_TYPES.CONNECTING);

    this.encodeCredentials()
      .then(() => {
        return this.handshakeSession();
      })
      .then(() => {
        return this.subscribeChannel();
      })
      .then(() => {
        this.connected = true;
        this.setStatus(this.STATUS_TYPES.CONNECTED);

        this.startNewConnection();
      })
      .catch(e => {
        if (e.error) {
          if (
            e.error === this.ERROR_TYPES.HANDSHAKE_FAILED ||
            e.error === this.ERROR_TYPES.SUBSCRIPTION_FAILED
          ) {
            this.handleSessionStartError();
            return;
          }
          if ((e.error = this.ERROR_TYPES.BAD_CRENETIALS)) {
            this.setStatus(this.STATUS_TYPES.INVALID_CREDENTIALS);
          }
        }
        if (e.code === 'EAI_AGAIN' || e.code === 'ECONNRESET') {
          this.handleSessionStartError();
          return;
        }
      });
  }

  /**
   * Handles if failed to start and tries again after 10sec
   */
  handleSessionStartError() {
    setTimeout(() => {
      this.start();
    }, 10000);
  }

  /**
   * Checks if there are already encoded credentials and encodes them, if not
   *
   * @returns {Promise}
   */
  encodeCredentials() {
    return new Promise((resolve, reject) => {
      this.credentials
        .getEncodedCredentials()
        .then(encodedCredentials => {
          this.encodedCredentials = encodedCredentials;
          resolve();
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  /**
   * Handle handshake
   * On success, the api delivers a clientId which represents the actual session
   *
   * @returns {Promise}
   */
  handshakeSession() {
    const url = `https://${this.auth.tenant}/cep/realtime`;
    const auth = `Basic ${this.encodedCredentials}`;
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth
        },
        data: [
          {
            version: '1.0',
            minimumVersion: '0.9',
            channel: '/meta/handshake',
            supportedConnectionTypes: ['long-polling'],
            advice: {
              timeout: 60000,
              interval: 0
            }
          }
        ]
      })
        .then(res => {
          const data = res.data[0];

          if (data && data.successful === true) {
            this.clientId = data.clientId;
            resolve();
          } else {
            this.setStatus(this.STATUS_TYPES.CONNECTION_FAILED);
            reject({ error: 'handshake_failed' });
          }
        })
        .catch(e => {
          this.setStatus();
          if (e && e.response && e.response.status === 401) {
            this.setStatus(this.STATUS_TYPES.INVALID_CREDENTIALS);
          }
          reject(e);
        });
    });
  }

  /**
   * Subscribes to a channel, e.g. /measurements/{sensorId}
   * On success, the channel will be added to the session. Now you can connect to the session to receive notifications
   *
   * @returns {Promise>}
   */
  subscribeChannel() {
    return new Promise((resolve, reject) => {
      if (!this.validateSensor()) {
        this.setStatus(this.STATUS_TYPES.INVALID_SENSOR);
        reject(new Error('Invalid Sensor'));
        return;
      }

      axios({
        method: 'post',
        url: `https://${this.auth.tenant}/cep/realtime`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.encodedCredentials}`
        },
        data: [
          {
            channel: '/meta/subscribe',
            subscription: `/${this.node.type}/${this.config.sensor}`,
            clientId: this.clientId
          }
        ]
      })
        .then(res => {
          const data = res.data[0];

          if (data && data.successful === true) {
            resolve();
          } else {
            reject(this.handleSubscribtionFail(data));
          }
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  /**
   * Validates connection and starts a new connection
   */
  startNewConnection() {
    if (this.connected === false) return;

    this.connect()
      .then(data => {
        this.handleNewMessage(data);
      })
      .catch(e => {
        this.handleConnectionFail(e);
      });
  }

  /**
   * A method to connect to the session
   * On success, the channel will be added to the session. Now you can connect to the session to receive notifications
   */
  connect() {
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: `https://${this.auth.tenant}/cep/realtime`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.encodedCredentials}`
        },
        timeout: 90000,
        data: [
          {
            channel: '/meta/connect',
            clientId: this.clientId,
            connectionType: 'long-polling',
            advice: { timeout: 60000, interval: 30000 }
          }
        ]
      })
        .then(res => {
          resolve(res.data);
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  /**
   * Stop receiving notifications from all channels and close the conversation
   */
  disconnect() {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        resolve();
      } else {
        this.connected = false;

        axios({
          method: 'post',
          url: `https://${this.auth.tenant}/cep/realtime`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${this.encodedCredentials}`
          },
          data: [
            {
              channel: '/meta/disconnect',
              clientId: this.clientId
            }
          ]
        })
          .then(() => {
            resolve();
          })
          .catch(e => {
            resolve();
          });
      }
    });
  }

  /**
   * Handles a connection fail
   * @param  {object} data a realtime-notification
   */
  handleNewMessage(data) {
    // Return on empty string messages after a redeploy
    if (typeof data === 'string') {
      this.startNewConnection();
      return;
    }

    const errorMessage = data.find(msg => {
      return msg.successful === false;
    });

    if (typeof errorMessage !== 'undefined') {
      this.handleErrorMessage(errorMessage);
    } else {
      const meassages = data.filter(msg =>
        msg.channel.includes(`/${this.node.type}`)
      );

      meassages.forEach(msg => {
        switch (this.node.type) {
          case 'measurements':
            this.processMeasurement(msg);
            break;
          case 'alarms':
            this.processAlarm(msg);
            break;
          case 'events':
            this.processEvent(msg);
            break;
          default:
            break;
        }
      });

      this.startNewConnection();
    }
  }

  /**
   * Handles error messages
   * @param  {object} errorMessage a realtime-notification which wasn't successfull
   */
  handleErrorMessage(errorMessage) {
    if (errorMessage.error && errorMessage.error.includes('402')) {
      this.handleExpiredSession();
    } else {
      this.startNewConnection();
    }
  }

  /**
   * Handles subscription fail
   * @param  {object} data a realtime-notification which wasn't successfull
   */
  handleSubscribtionFail(data) {
    if (data.error && data.error.includes('403')) {
      return { error: 'bad_credentials' };
    } else {
      return { error: 'subscribtion_failed' };
    }
  }

  /**
   * A methos to process a new measurement notification
   * @param  {object} msg a realtime-notification
   */
  processMeasurement(msg) {
    const { data } = msg.data;

    // only process messages from the selected channel
    if (Object.keys(data).some(key => key === this.config.channel)) {
      const measurement = new Measurement(
        data,
        this.config.datapoint,
        this.config.channel
      );
      this.node.send(measurement.getMsg(this.config.format));
    }
  }

  /**
   * A methos to process a new alarm notification
   * @param  {object} msg a realtime-notification
   */
  processAlarm(msg) {
    const { data } = msg;

    // only process messages from the selected channel
    if (data.data.type.includes(this.config.channel)) {
      const alarm = new Alarm(data);

      this.node.send(alarm.getMsg(this.config.format));
    }
  }

  /**
   * A methos to process a new events notification
   * @param  {object} msg a realtime-notification
   */
  processEvent(msg) {
    const { data } = msg;

    // only process messages from the selected channel
    if (data.data.type.includes(this.config.channel)) {
      const event = new Event(data);

      this.node.send(event.getMsg(this.config.format));
    }
  }

  /**
   * Handles if the session expires (after about 8 hours)
   */
  handleExpiredSession() {
    this.connected = false;
    this.start();
  }

  /**
   * Handles a connection fail
   */
  handleConnectionFail(e) {
    if (e && e.response && e.response.status === 401) {
      this.setStatus(this.STATUS_TYPES.INVALID_CREDENTIALS);
      this.disconnect();
    } else {
      const errorMsg = `${new Date()} Connection lost. Retry in 10s`;
      this.node.error(errorMsg);
      setTimeout(() => {
        this.startNewConnection();
      }, 10);
    }
  }

  /**
   * A method to validate if a valid sensor is selected
   */
  validateSensor() {
    const { sensor = '' } = this.config;
    if (sensor === '') {
      return false;
    } else {
      return true;
    }
  }

  /**
   * A method to change the status of the node
   */
  setStatus(statusType) {
    switch (statusType) {
      case this.STATUS_TYPES.MISSING_CREDENTIALS:
        this.node.status({
          fill: 'red',
          shape: 'dot',
          text: 'Missing Credentials'
        });
        break;
      case this.STATUS_TYPES.INVALID_CREDENTIALS:
        this.node.status({
          fill: 'red',
          shape: 'dot',
          text: 'Invalid Credentials'
        });
        break;
      case this.STATUS_TYPES.INVALID_SENSOR:
        this.node.status({
          fill: 'red',
          shape: 'dot',
          text: 'No valid Sensor selected'
        });
        break;
      case this.STATUS_TYPES.CONNECTING:
        this.node.status({
          fill: 'green',
          shape: 'ring',
          text: 'Connecting...'
        });
        break;
      case this.STATUS_TYPES.CONNECTED:
        this.node.status({
          fill: 'green',
          shape: 'dot',
          text: 'Connected'
        });
        break;
      case this.STATUS_TYPES.CONNECTION_FAILED:
        this.node.status({
          fill: 'red',
          shape: 'dot',
          text: 'Failed to establish connection'
        });
        break;
      default:
        this.node.status({
          fill: 'red',
          shape: 'dot',
          text: 'Failed to establish connection. Please verify your credentials'
        });
        break;
    }
  }
}

module.exports = RealTime;
