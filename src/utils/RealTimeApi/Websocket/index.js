const uuid = require('uuid');
const WebSocket = require('ws');
const Credentials = require('../../Credentials');
const Measurement = require('../../Measurement');
const Alarm = require('../../Alarm');
const Event = require('../../Event');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Create subscription and subscriber for every node (uinque node id)
// Not persistant
// Store state in Sensors managed Object (token)
// Name of subscribers must not change for one node

/**
 * Connects to cumulocity's realtime-notification API
 * */
class RealTimeWs {
  constructor(node, config, auth) {
    this.node = node;
    this.config = config;
    this.auth = auth;
    this.tenantId = '';
    this.encodedCredentials = '';
    this.jwt = null;

    // Remove non-alphanumeric characters from channel for clientId
    const cleanChannel = this.config.channel.replace(/[^a-zA-Z0-9]/g, '');
    // client id must be alphanumeric
    // iokeynodered as prefix
    // type => t${this.config.type} "measurements", "alarms", "events"
    // sensor => s${this.config.sensor}
    // channel => c${this.config.channel}
    this.clientId = `iokeynoderedt${this.config.type}s${this.config.sensor}c${cleanChannel}`;

    this.subResponse = null;
    this.pingInterval = null;
    this.pingTimeout = null;
    this.pingIntervalTime = 60000; // Sending ping every minute
    this.pongTimeoutTime = 10000; // pong must be received within 10s
    this.tokenExpiresIn = 1440; // max 1440
    this.tokenExpired = false;
    this.wsTimeUntilTimeout = 30000;
    this.baseReconnectDelay = 10000;
    this.retryCount = 0;
    this.connected = false;
    this.sws = null;
    this.reconnectTimeout = null;

    this.setCredentials(auth);

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
   * Set credentials if existing
   * @param {*} auth
   */
  setCredentials(auth) {
    if (auth !== null) {
      this.credentials = new Credentials(auth);
    }
  }

  /**
   * Check if connection info exists and is valid, otherwise create new subscription
   */
  async checkConnectionInfo() {
    const url = `https://${this.auth.tenant}/inventory/managedObjects/${this.config.sensor}`;
    const auth = `Basic ${this.encodedCredentials}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: auth,
          Accept: 'application/json'
        }
      });

      const data = await response.json();

      // Check and cleanup old subscriptions
      // await this.cleanupOldSubscriptions(data);

      const connectionKey = `io-key-node-red_${this.config.type}_${this.config.sensor}_${this.config.channel}`;
      const connectionInfo = data[connectionKey];

      if (connectionInfo) {
        const token = connectionInfo.token;
        const subscriptionId = connectionInfo.subscriptionId;

        if (token && subscriptionId) {
          // Check if subscription is still valid
          try {
            const subscriptionResponse = await fetch(
              `https://${this.auth.tenant}/notification2/subscriptions/${subscriptionId}`,
              {
                method: 'GET',
                headers: {
                  Authorization: auth,
                  Accept: 'application/json'
                }
              }
            );

            if (subscriptionResponse.status === 404) {
              console.log(
                '[info] Subscription no longer exists, creating new one...'
              );
              return false;
            }

            // Check if token is expired
            try {
              const tokenData = JSON.parse(atob(token.split('.')[1]));

              if (tokenData.exp * 1000 > Date.now()) {
                this.jwt = token;
                console.log(
                  `[info] Reusing existing subscription and token from ${connectionKey}`
                );
                // Update lastUsed when reusing valid token
                await this.updateLastUsed();
                return true;
              } else {
                console.log(
                  `[info] Found existing subscription with expired token (expired at ${new Date(
                    tokenData.exp * 1000
                  ).toISOString()}), renewing...`
                );
              }
            } catch (e) {
              console.log('[error] Failed to parse token:', e);
            }
          } catch (e) {
            console.log('[error] Failed to check subscription validity:', e);
            return false;
          }
        } else {
          if (!token) {
            console.log('[warn] Found existing subscription without token');
          }
          if (!subscriptionId) {
            console.log(
              '[warn] Found existing subscription without subscription ID'
            );
          }
        }

        // Token expired, get new one
        if (connectionInfo.subscriber && connectionInfo.subscription) {
          const tokenResponse = await fetch(
            `https://${this.auth.tenant}/notification2/token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: auth
              },
              body: JSON.stringify({
                subscriber: connectionInfo.subscriber,
                subscription: connectionInfo.subscription,
                expiresInMinutes: 5
              })
            }
          );

          const newToken = await tokenResponse.json();
          if (newToken.token) {
            this.jwt = newToken.token;
            await this.storeConnectionInfo(
              connectionInfo.subscriber,
              connectionInfo.subscription,
              newToken.token,
              connectionInfo
            );
            return true;
          }
        }
      }

      return false;
    } catch (e) {
      console.log('[error] Failed to check connection info:', e);
      return false;
    }
  }

  // /**
  //  * Unsubscribe and cleanup old subscriptions
  //  * @param {object} managedObject The managed object containing subscriptions
  //  */
  // async cleanupOldSubscriptions(managedObject) {
  //   const sevenDaysAgo = new Date();
  //   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  //   for (const [key, value] of Object.entries(managedObject)) {
  //     // Skip if not an io-key subscription or if it's the current subscription
  //     if (
  //       !key.startsWith('io-key-node-red_') ||
  //       key === `io-key-node-red_${this.config.id}`
  //     ) {
  //       continue;
  //     }

  //     // Check if subscription is old (not used for 7 days)
  //     if (value.lastUsed && new Date(value.lastUsed) < sevenDaysAgo) {
  //       console.log(`[info] Found old subscription: ${key}, deleting...`);
  //       try {
  //         // If token is expired, get a new one
  //         let token = value.token;
  //         const tokenData = JSON.parse(atob(token.split('.')[1]));
  //         if (tokenData.exp * 1000 <= Date.now()) {
  //           const tokenResponse = await fetch(
  //             `https://${this.auth.tenant}/notification2/token`,
  //             {
  //               method: 'POST',
  //               headers: {
  //                 'Content-Type': 'application/json',
  //                 Accept: 'application/json',
  //                 Authorization: `Basic ${this.encodedCredentials}`
  //               },
  //               body: JSON.stringify({
  //                 subscriber: value.subscriber,
  //                 subscription: value.subscription,
  //                 expiresInMinutes: 5
  //               })
  //             }
  //           );
  //           const newToken = await tokenResponse.json();
  //           token = newToken.token;
  //         }

  //         // Unsubscribe
  //         await fetch(
  //           `https://${this.auth.tenant}/notification2/unsubscribe?token=${token}`,
  //           {
  //             method: 'POST',
  //             headers: {
  //               Accept: 'application/json'
  //             }
  //           }
  //         );

  //         // Delete subscription from managed object
  //         await fetch(
  //           `https://${this.auth.tenant}/inventory/managedObjects/${this.config.sensor}`,
  //           {
  //             method: 'PUT',
  //             headers: {
  //               'Content-Type': 'application/json',
  //               Accept: 'application/json',
  //               Authorization: `Basic ${this.encodedCredentials}`
  //             },
  //             body: JSON.stringify({
  //               [key]: null
  //             })
  //           }
  //         );

  //         console.log(`[info] Cleaned up old subscription: ${key}`);
  //       } catch (e) {
  //         console.log(`[error] Failed to cleanup subscription ${key}:`, e);
  //       }
  //     }
  //   }
  // }

  /**
   * Store connection info in managed object
   */
  async storeConnectionInfo(
    subscriber,
    subscription,
    token,
    existingInfo = null
  ) {
    const url = `https://${this.auth.tenant}/inventory/managedObjects/${this.config.sensor}`;
    const auth = `Basic ${this.encodedCredentials}`;
    const connectionKey = `io-key-node-red_${this.config.type}_${this.config.sensor}_${this.config.channel}`;

    try {
      // Parse token to get expiration
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = new Date(tokenData.exp * 1000).toISOString();

      if (existingInfo) {
        console.log(
          `[info] Updating subscription with new token, valid until ${expiresAt}`
        );
      } else {
        console.log(
          `[info] Storing new subscription in ${connectionKey}, token valid until ${expiresAt}`
        );
      }

      const now = new Date().toISOString();
      const payload = {
        [connectionKey]: {
          type: this.config.type,
          channel: this.config.channel,
          subscriber: subscriber,
          subscription: subscription,
          subscriptionId: this.subResponse?.id,
          token: token,
          createdAt: existingInfo ? existingInfo.createdAt : now,
          updatedAt: now,
          lastUsed: now,
          expiresAt: expiresAt
        }
      };

      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: auth
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.log('[error] Failed to store connection info:', e);
    }
  }

  /**
   * Starts a session, subscribe to a channel and then connects to receive data
   */
  async start() {
    if (!Credentials.validateCredentials(this.auth)) {
      this.setStatus(this.STATUS_TYPES.MISSING_CREDENTIALS);
      return;
    }

    this.setStatus(this.STATUS_TYPES.CONNECTING);

    try {
      await this.encodeCredentials();

      // Check existing connection info
      const hasValidConnection = await this.checkConnectionInfo();

      if (!hasValidConnection) {
        // Create new subscription and get token
        await this.createSubscription();
        const tokenResponse = await this.getToken();
        await this.storeConnectionInfo(
          this.clientId,
          this.clientId,
          tokenResponse
        );
      }

      setTimeout(() => {
        console.log('[info] Successfully connected!');
        this.connected = true;
        this.setStatus(this.STATUS_TYPES.CONNECTED);
        return this.startNewConnection();
      }, 1000);
    } catch (e) {
      if (e.error) {
        if (
          e.error === this.ERROR_TYPES.HANDSHAKE_FAILED ||
          e.error === this.ERROR_TYPES.SUBSCRIPTION_FAILED
        ) {
          this.handleSessionStartError();
          return;
        }
        if (e.error === this.ERROR_TYPES.BAD_CREDENTIALS) {
          this.setStatus(this.STATUS_TYPES.INVALID_CREDENTIALS);
        }
      }
      if (e.code === 'EAI_AGAIN' || e.code === 'ECONNRESET') {
        this.handleSessionStartError();
        return;
      }
    }
  }

  async handleSessionStartError() {
    console.log('[error] Failed to start session, try again in 10 seconds!');
    await new Promise(resolve => setTimeout(resolve, 10000));
    this.start();
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
   * @returns {Promise<string>} The JWT token
   */
  async getToken() {
    const url = `https://${this.auth.tenant}/notification2/token`;
    const auth = `Basic ${this.encodedCredentials}`;

    try {
      const reqPayload = {
        subscriber: this.clientId,
        subscription: this.clientId,
        expiresInMinutes: 5
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: auth
        },
        body: JSON.stringify(reqPayload)
      });

      const response = await res.json();
      const token = response.token;

      if (token && token.length !== 0) {
        console.log(`[info] Successfully fetched token (Code: ${res.status})`);
        this.jwt = token;
        return token;
      } else {
        console.log(`[info] Failed to fetch token (Code: ${res.status})`);

        if (res.status === 403) {
          this.setStatus(this.STATUS_TYPES.INVALID_CREDENTIALS);
        } else {
          this.setStatus(this.STATUS_TYPES.CONNECTION_FAILED);
        }

        throw { error: 'handshake_failed' };
      }
    } catch (e) {
      console.log('[error]: Error fetching token', e);
      this.setStatus(this.STATUS_TYPES.CONNECTION_FAILED);
      if (e?.response?.status === 401) {
        this.setStatus(this.STATUS_TYPES.INVALID_CREDENTIALS);
      }
      throw e;
    }
  }

  /**
   * Create a subscription
   * @returns {Promise<void>}
   */
  async createSubscription() {
    if (!this.validateSensor()) {
      this.setStatus(this.STATUS_TYPES.INVALID_SENSOR);
      throw new Error('Invalid Sensor');
    }

    console.log(this.node);
    console.log(this.config);

    const reqPayload = {
      source: {
        id: this.config.sensor
      },
      context: 'mo',
      subscription: this.clientId,
      subscriptionFilter: {
        apis: [this.node.type]
      },
      nonPersistent: true,
      shared: true
    };

    console.log(reqPayload);

    try {
      const res = await fetch(
        `https://${this.auth.tenant}/notification2/subscriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/vnd.com.nsn.cumulocity.subscription+json',
            Authorization: `Basic ${this.encodedCredentials}`
          },
          body: JSON.stringify(reqPayload)
        }
      );

      const data = await res.json();

      if (data?.id?.length !== 0) {
        console.log('[info] Successfully created Subscription');
        this.subResponse = data;
      } else {
        throw this.handleSubscriptionFail(data);
      }
    } catch (e) {
      console.log('[error] Error creating subscription', e);
      const errMsg = this.handleSubscriptionFail({
        error: [e.response?.status || 'An unexpected error occurred.']
      });
      this.setStatus(errMsg.error);
      throw e;
    }
  }

  /**
   * Validates connection and starts a new connection
   */
  startNewConnection() {
    if (this.connected === false) return;

    this.connect();
  }

  getReconnectDelay() {
    return (
      this.baseReconnectDelay *
      (Math.min(this.retryCount, 5) * Math.min(this.retryCount, 5))
    );
  }

  /**
   * A method to connect to the session
   * On success, the channel will be added to the session. Now you can connect to the session to receive notifications
   */
  connect() {
    if (this.tokenExpired) return;

    if (!this.jwt || !this.auth.tenant) {
      throw new Error(
        'Websocket connection failed because of missing information'
      );
    }

    clearTimeout(this.reconnectTimeout);

    console.log('[debug] Start connection');

    this.retryCount = this.retryCount + 1;

    const sendPing = () => {
      console.log('[info] Send ping');
      this.sws.ping();

      this.pongTimeout = setTimeout(() => {
        console.log('[info] Terminate due to pong timeout');

        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        this.sws.terminate();

        clearTimeout(this.pingTimeout);
        clearInterval(this.pingInterval);
      }, this.pongTimeoutTime);
    };

    this.sws = new WebSocket(
      `wss://${this.auth.tenant}/notification2/consumer/?token=${this.jwt}`
    );

    this.sws.on('pong', () => {
      console.log('[debug] Received pong');
      clearTimeout(this.pongTimeout);
    });

    this.sws.on('close', (code, reason) => {
      const delay = this.getReconnectDelay();
      console.log(
        `[info] Connection closed. (Code: ${code}, Reason: ${reason}). Reconnecting in ${
          delay / 1000
        }s...`
      );
      clearTimeout(this.pingTimeout);
      clearInterval(this.pingInterval);
      this.reconnectTimeout = setTimeout(() => this.connect(), delay);
    });

    this.sws.on('error', async err => {
      console.log(`[error] Connection error`);
      console.log(err);

      if (err.message.includes('401')) {
        console.log('Subscribes token expired, renewing...');
        this.tokenExpired = true;
        try {
          await this.getToken();

          console.log('[info] Renewed token');

          this.tokenExpired = false;

          this.sws.terminate();
          // this.connect();
        } catch (err) {
          console.log(`[error] Failed to renew token.`, e);
        }
      }
    });

    this.sws.on('open', () => {
      this.retryCount = 0;

      this.pingInterval = setInterval(sendPing, this.pingIntervalTime);

      // console.log('[info] Waiting for messages (new)');
      this.sws.on('message', data => {
        console.log('[debug] Received message');
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

    clearTimeout(this.pingTimeout);
    clearInterval(this.pingInterval);
  }

  /**
   * Update lastUsed timestamp for current connection
   */
  async updateLastUsed() {
    const url = `https://${this.auth.tenant}/inventory/managedObjects/${this.config.sensor}`;
    const auth = `Basic ${this.encodedCredentials}`;
    const connectionKey = `io-key-node-red_${this.config.type}_${this.config.sensor}_${this.config.channel}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: auth,
          Accept: 'application/json'
        }
      });

      const data = await response.json();
      const connectionInfo = data[connectionKey];

      if (connectionInfo) {
        const now = new Date().toISOString();
        await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: auth
          },
          body: JSON.stringify({
            [connectionKey]: {
              ...connectionInfo,
              lastUsed: now
            }
          })
        });
      }
    } catch (e) {
      console.log('[error] Failed to update lastUsed timestamp:', e);
    }
  }

  /**
   * Handles a connection fail
   * @param  {string} data a realtime-notification
   */
  handleNewMessage(data) {
    // console.log(data);
    // console.log(data.toString('utf-8'));
    // First 3 Lines are header

    const [header, body] = data.toString('utf-8').split('\n\n');

    // encoded binary 64 bit value, notification type and source, CREATE | UPDATE | DELETE | ... must be CREATE for measurements
    const [msgID, notificationDesc, action] = header.split('\n');
    // notificationType event, measurement, alarm or managed object.
    // const [tenantID, notificationType, source] = notificationDesc.split('/');
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
    const msg = JSON.parse(body);

    // ACK receipt
    this.sws.send(msgID.trim());

    // parsedBody[this.node.type];

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
    // only process messages from the selected channel
    if (Object.keys(msg).some(key => key === this.config.channel)) {
      const measurement = new Measurement(
        msg,
        this.config.datapoint,
        this.config.channel
      );

      this.node.send(measurement.getMsg(this.config.format));
    }
  }

  /**
   * Process a new alarm notification
   * @param  {object} msg a realtime-notification
   */
  processAlarm(msg) {
    const formattedMsg = {
      data: msg
    };

    // only process messages from the selected channel
    if (msg.type.includes(this.config.channel)) {
      const alarm = new Alarm(formattedMsg);

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
