/**
 * Represents a measurement
 */
class Event {
  constructor(data) {
    this.formatDefault(data);
  }

  /**
   * Returns the message with the given format
   * @param  {string} type "none", "c8y", "mdsp" or ppmp
   * @param  {object} defaultMsg default msg
   * @returns {object} standardized message
   */
  getMsg(type) {
    switch (type) {
      case 'c8y':
        return this.formatC8y();
      case 'mdsp':
        return this.formatMdsp();
      case 'ppmp':
        return this.formatPPMP();
      default:
        return this.msg;
    }
  }

  /**
   * Formats the notfication data into a standardized format
   * @returns {object} standardized message
   *
   *  msg.payload = {
   *    "action: "CREATED,
   *    "source": "869876"
   *    "time": "2019-08-01T18:10:28.845Z",
   *    "text": "A event was triggered",
   *    "id": "968305",
   *    "type": "test_event_123456789012345-AU004-1-1"
   *  }
   */
  formatDefault(data) {
    const action = data.realtimeAction;
    const { time, text, id, type } = data.data;
    const source = data.data.source.id;

    this.msg = {
      payload: { action, time, text, id, type, source }
    };
  }

  /**
   * Formats the default message into the cumulocity format
   * https://cumulocity.com/guides/reference/events/
   * @returns {object} cumulocity formatted msg
   *
   *  msg.payload = {
   *    "type" : "com_cumulocity_events_TamperEvent",
   *    "time" : "2011-09-06T12:03:27.845Z",
   *    "text" : "Tamper sensor triggered",
   *    "source" : { "id" : "12345", "self" : "..." },
   *  }
   */
  formatC8y() {
    const { type, time, source, text } = this.msg.payload;
    return {
      payload: {
        type,
        source: {
          id: source
        },
        time,
        text
      }
    };
  }

  /**
   * Formats the default message into the MindConnect format
   * https://flows.nodered.org/node/@mindconnect/node-red-contrib-mindconnect
   * @returns {object} mindsphere formatted msg
   *
   *  msg.payload = {
   *    sourceType: "Agent",
   *    sourceId: "application",
   *    source: "Meowz",
   *    severity: 30, // 0-99 : 20:error, 30:warning, 40: information
   *    description: "Event sent at " + new Date().toISOString(),
   *    timestamp: new Date().toISOString(),
   *    acknowledged: true
   *  };
   */
  formatMdsp() {
    const { time, text, source } = this.msg.payload;
    return {
      payload: {
        description: text,
        severity: 40,
        timestamp: time,
        sourceType: 'Agent',
        sourceId: 'application',
        source
      }
    };
  }

  /**
   * Formats the default message into the PPMP format
   * https://www.eclipse.org/unide/specification/v2/measurement-message#schema-detail
   * @returns {object} PPMP formatted msg
   *
   *  msg.payload = {
   *    content-spec: "urn:spec://eclipse.org/unide/machine-message#v2",
   *    device: {
   *      deviceID: "1234",
   *    },
   *    messages: [{
   *      ts: "2011-09-06T12:03:27.845Z",
   *      description: "Threshold exceeded",
   *      severity: "LOW",
   *      type: "DEVICE",
   *      origin: "test_event_123456789012345-AU004-1-1"
   *    }]
   *  }
   */
  formatPPMP() {
    const { time, text, type, source } = this.msg.payload;

    return {
      payload: {
        'content-spec': 'urn:spec://eclipse.org/unide/machine-message#v2',
        device: {
          deviceID: source
        },
        messages: [
          {
            description: text,
            ts: time,
            origin: type,
            severity: 'LOW',
            type: 'DEVICE'
          }
        ]
      }
    };
  }
}

module.exports = Event;
