const axios = require('axios');
const uuid = require('uuid');
const ws = require('ws');
const Credentials = require('../../Credentials');
const Measurement = require('../../Measurement');
const Alarm = require('../../Alarm');
const Event = require('../../Event');

/**
 * Connects to cumulocity's realtime-notification API
 * */
class RealTimeWs {
  constructor(node, config, auth) {
    this.node = node;
    this.config = config;
    this.auth = auth;
    this.tenantId = '';
    this.credentials = new Credentials(auth);
    this.encodedCredentials = '';
    this.jwt = null;
    this.subscriptionName = 'nodeRed' + uuid.v4().replace(/-/g, '');
    this.clientId = 'node-red-' + uuid.v4();
    this.subResponse = null;

    this.subscriptionNameID = null;
    this.connected = false;
    this.sws = null;

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
      SUBSCRIPTION_FAILED: 'subscription_failed',
      BAD_CREDENTIALS: 'bad_credentials'
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
    console.log(this.config);

    this.setStatus(this.STATUS_TYPES.CONNECTING);

    this.encodeCredentials()
      .then(() => {
        return this.createSubscription();
      })
      .then(() => {
        return this.getToken();
      })
      .then(() => {
        this.connected = true;
        this.setStatus(this.STATUS_TYPES.CONNECTED);
        return
        // \return this.startNewConnection();
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
          if ((e.error = this.ERROR_TYPES.BAD_CREDENTIALS)) {
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
   * TODO: USE encode method of REST implementation
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
   * Request a jwt token from notification 2.0 api
   *
   * @returns {Promise}
   */
  getToken() {
    const url = `https://${this.auth.tenant}/notification2/token`;
    const auth = `Basic ${this.encodedCredentials}`;
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: auth
        },
        data: [
          {
            subscriber: this.clientId,
            subscription: this.subscriptionName,
            expiresInMinutes: 1440
          }
        ]
      })
        .then(res => {
          const data = res.data[0];

          if (data && data.token.length !== 0) {
            this.jwt = data.token;
            return resolve(this.jwt);
          } else {
            this.setStatus(this.STATUS_TYPES.CONNECTION_FAILED);
            return reject({ error: 'handshake_failed' });
          }
        })
        .catch(e => {
          console.log("Markus" + JSON.stringify(e.response.status))
          this.setStatus(this.STATUS_TYPES.CONNECTION_FAILED);
          if (e && e.response && e.response.status === 401) {
            this.setStatus(this.STATUS_TYPES.INVALID_CREDENTIALS);
          }
          reject(e);
        });
    });
  }

  /**
   * Create a subscription
   *
   * @returns {Promise>}
   */
  createSubscription() {
    return new Promise((resolve, reject) => {
      if (!this.validateSensor()) {
        this.setStatus(this.STATUS_TYPES.INVALID_SENSOR);
        reject(new Error('Invalid Sensor'));
        return;
      }

      const reqPayload = {
        source: {
          id: this.config.sensor
        },
        context: 'mo',
        subscription: this.subscriptionName,
        subscriptionFilter: {
          apis: [
            'measurements'
          ]
        }
      };
      return axios({
        method: 'post',
        url: `https://${this.auth.tenant}/notification2/subscriptions`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${this.encodedCredentials}`
        },
        data: reqPayload
      })
      .then(res => {
          const data = res.data[0];

          if (data && data.id.length !== 0) {
            this.subResponse = data;
          } else {
            reject(this.handleSubscriptionFail(data));
          }
        })
        .catch((e) => {
          const errMsg = this.handleSubscriptionFail({error: [
            e.response.status
          ]})
          this.setStatus(errMsg.error);
          reject(e);
        });
    });
  }

  /**
   * Validates connection and starts a new connection
   */
  startNewConnection() {
    if (this.connected === false) return;

    this.connect();
  }

  /**
   * A method to connect to the session
   * On success, the channel will be added to the session. Now you can connect to the session to receive notifications
   */
  connect() {
    if (!this.jwt || !this.auth.tenant)
      throw new Error(
        'Websocket connection failed because of missing information'
      );
    this.sws = new ws.WebSocketServer(
      `wss://${this.auth.tenant}/notification2/consumer/?token=${this.jwt}`
    );
    sws.on('error', () => {
      this.connect();
    });
    this.sws.on('open', () => {
      this.sws.on('message', data => {
        this.handleNewMessage(data);
      });
    });

  }

  /**
   * Stop receiving notifications from all channels and close the conversation
   */
  disconnect() {
    if (!this.connected) return;

    this.connected = false;
    this.sws.close(err => {
      // logging ?
    });
    this.sws.terminate();
    this.sws = null;
  }

  /**
   * Handles a connection fail
   * @param  {string} data a realtime-notification
   */
  handleNewMessage(data) {
    if (data.length === 0) {
      return;
    }
    console.log(data);

    // First 3 Lines are header
    const [header, body ] = data.split('\n\n');
    // encoded binary 64 bit value, notification type and source, CREATE | UPDATE | DELETE | ... must be CREATE for measurements
    const [msgID, notificationDesc, action] = header.split('\n');
    // notificationType event, measurement, alarm or managed object. 
    const [tenantID, notificationType, source] = notificationDesc.split('/');
    /*
    {
      "<FRAGMENT_NAME>": {
        "<SERIES>": {
          "value": <>,
          "unit": <>
        }
      },
      ...
      "time": "2021-06-11T17:03:14.000+02:00",
      "source": {
        "id":"<DEVICE_ID>"
      },
    "type": <>
    }
    */
    const parsedBody = JSON.parse(body);
    const measurements = Object.fromEntries(Object.entries(parsedBody).filter(([prop, val]) => !['time'].includes(prop)));

    // ACK receipt
    this.sws.send(msgID.trim());
  
    // parsedBody[this.node.type];
    const messages = [];

    messages.forEach(msg => {
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
  }

  /**
   * Handles subscription fail
   * @param  {object} data a realtime-notification which wasn't successfully
   */
  handleSubscriptionFail(data) {
    if (!data.error) {
      throw new Error('No HTTP status code found');
    }

    if (data.error.includes('401')) return { error: 'bad_credentials' };
    if (data.error.includes('403')) return { error: 'permissions_fail' };
    if (data.error.includes('404')) return { error: 'managed_object_unknown' };
    if (data.error.includes('409')) return { error: 'duplicated_subscription' };
    if (data.error.includes('422')) return { error: 'invalid_payload' };
    return { error: 'subscription_failed' };
  }

  /**
   * Process a new measurement notification
   * @param  {object} msg a realtime-notification
   */
  processMeasurement(msg) {
    const { data } = msg.data;

    // only process messages from the selected channel
    if (data.type === this.config.channel) {
      const measurement = new Measurement(data, this.config.datapoint);

      this.node.send(measurement.getMsg(this.config.format));
    }
  }

  /**
   * Process a new alarm notification
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
   * Process a new events notification
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
          text: statusType
        });
        break;
    }
  }
}

module.exports = RealTimeWs;
