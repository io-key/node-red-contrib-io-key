/**
 * Represents a measurement
 */
class Measurement {
  constructor(data) {
    this.formatDefault(data);
  }

  /**
   * Returns the message in the given format
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
   * Formats the notification data into a standardized format
   * @returns {object} standardized message
   *
   *  msg.payload = {
   *    "action": "UPDATE",
   *    "severity": "CRITICAL",
   *    "time": "2019-08-01T07:35:27.352Z",
   *    "text": "Threshold exceeded",
   *    "id": "887765",
   *    "type": "c8y_Threshold_123456789012345-AU004-1-1",
   *    "status": "CLEARED",
   *    "source": "869876"
   *  }
   */
  formatDefault(data) {
    const action = data.realtimeAction;
    const { severity, time, text, id, type, status } = data.data;
    const source = data.data.source.id;

    this.msg = {
      payload: { action, severity, time, text, id, type, status, source }
    };
  }

  /**
   * Formats the default message into the cumulocity format
   * https://cumulocity.com/guides/reference/alarms/
   * @returns {object} cumulocity formatted msg
   *
   *  msg.payload = {
   *    "type" : "com_cumulocity_events_TamperEvent",
   *    "time" : "2011-09-06T12:03:27.845Z",
   *    "text" : "Tamper sensor triggered",
   *    "status" : "ACTIVE",
   *    "severity" : "MAJOR",
   *    "source" : { "id" : "12345", "self" : "..." }
   *  }
   */
  formatC8y() {
    const { type, time, status, source, text, severity } = this.msg.payload;
    return {
      payload: {
        type,
        source: {
          id: source
        },
        time,
        status,
        severity,
        text
      }
    };
  }

  /**
   * Formats the default message for the MindConnect node
   * https://flows.nodered.org/node/@mindconnect/node-red-contrib-mindconnect
   * @returns {object} MindSphere MindConnect formatted msg
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
    const { time, text, source, severity, status } = this.msg.payload;
    let mdspSeverity = 20;
    let mdspAcknowledged = false;

    switch (severity) {
      case 'WARNING':
        mdspSeverity = 30;
        break;

      case 'CRITICAL':
      case 'MAJOR':
      case 'MINOR':
      default:
        mdspSeverity = 20;
        break;
    }

    switch (status) {
      case 'ACKNOWLEDGED':
      case 'CLEARED':
        mdspAcknowledged = false;
        break;
      case 'ACTIVE':
      default:
        mdspAcknowledged = false;
        break;
    }

    return {
      payload: {
        description: text,
        severity: mdspSeverity,
        timestamp: time,
        sourceType: 'Agent',
        sourceId: 'application',
        source,
        acknowledged: mdspAcknowledged
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
   *      severity: "HIGH",
   *      type: "DEVICE",
   *      origin: "c8y_Threshold_123456789012345-AU004-1-1"
   *    }]
   *  }
   */
  formatPPMP() {
    const { time, severity, type, source, text } = this.msg.payload;
    let ppmpSeverity = 'HIGH';

    switch (severity) {
      case 'MAJOR':
      case 'MINOR':
        ppmpSeverity = 'MEDIUM';
      case 'WARNING':
        ppmpSeverity = 'LOW';
        break;
      case 'CRITICAL':
      default:
        ppmpSeverity = 'HIGH';
        break;
    }

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
            severity: ppmpSeverity,
            type: 'DEVICE'
          }
        ]
      }
    };
  }
}

module.exports = Measurement;
