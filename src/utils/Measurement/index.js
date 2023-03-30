/**
 * Represents a measurement
 */
class Measurement {
  constructor(data, dataPointId, channel) {
    this.channel = channel;
    this.dataPointId = dataPointId;
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
   *    type: '123456789012345-AU004-1-1',
   *    time: '2019-07-29T09:32:28.187Z',
   *    series: 'Series-837-39',
   *    value: 65,
   *    unit: null
   *  }
   */
  formatDefault(data) {
    const { type, time } = data;
    const source = data.source.id;
    const seriesData = data[this.channel];
    const { value, unit } = seriesData[type];

    this.msg = {
      payload: { type: this.channel, time, series: type, value, unit, source }
    };
  }

  /**
   * Formats the default message into a cumulocity format
   * https://cumulocity.com/guides/reference/measurements/#measurement-api
   * @returns {object} cumulocity formatted msg
   *
   *  msg.payload = {
   *    "c8y_SpeedMeasurement": {
   *      "speed": {
   *        "value": 25,
   *        "unit": "km/h"
   *      }
   *    },
   *    "time": "2013-06-22T17:03:14.000+02:00",
   *    "source": {
   *      "id": "10200"
   *     },
   *    "type": "c8y_SpeedMeasurement"
   *  }
   */
  formatC8y() {
    const { type, time, series, value, unit, source } = this.msg.payload;
    return {
      payload: {
        type,
        [type]: {
          [series]: {
            value,
            unit
          }
        },
        time,
        source: {
          id: source
        }
      }
    };
  }

  /**
   * Formats the default message into a mindsphere connect format
   * https://flows.nodered.org/node/@mindconnect/node-red-contrib-mindconnect
   * @returns {object} mindsphere formatted msg
   *
   *  msg.payload = [
   *    { dataPointId: "1000000000", qualityCode: "1", value: "42" },
   *    { dataPointId: "1000000001", qualityCode: "1", value: "33.7" },
   *    { dataPointId: "1000000003", qualityCode: "1", value: "45.76" }
   *  ]
   *  msg._time = "2013-06-22T17:03:14.000+02:00"
   */
  formatMdsp() {
    const { time, value } = this.msg.payload;
    return {
      _time: new Date(time),
      payload: [
        {
          dataPointId: this.dataPointId,
          qualityCode: '1',
          value: value.toString()
        }
      ]
    };
  }

  /**
   * Formats the default message into a ppmp format
   * https://www.eclipse.org/unide/specification/v2/measurement-message#schema-detail
   * @returns {object} ppmp formatted msg
   *
   *  msg.payload = {
   *    content-spec: "urn:spec://eclipse.org/unide/measurement-message#v2",
   *    device: {
   *      deviceID: "1234",
   *    },
   *    measurements: [{
   *      series: {
   *        "$_time": [
   *          0,
   *          22,
   *          24
   *        ],
   *        "temperature": [
   *           45.4231,
   *           46.4222,
   *           44.2432
   *        ]
   *      },
   *      ts: "2013-06-22T17:03:14.000+02:00"
   *    }]
   *  }
   */
  formatPPMP() {
    const { time, series, value, source } = this.msg.payload;
    return {
      payload: {
        'content-spec': 'urn:spec://eclipse.org/unide/measurement-message#v2',
        device: {
          deviceID: source
        },
        measurements: [
          {
            series: {
              $_time: [0], // Currently, there is only one value per message, so this will always be 0
              [series]: [value]
            },
            ts: time
          }
        ]
      }
    };
  }
}

module.exports = Measurement;
