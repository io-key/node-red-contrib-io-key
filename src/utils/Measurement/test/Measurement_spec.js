const Measurment = require('..');

const data = {
  self: 'http://tenant.cumulocity.com/measurement/measurements/757831',
  time: '2019-07-29T12:38:38.856Z',
  id: '757831',
  source: {
    self: 'http://tenant.cumulocity.com/inventory/managedObjects/1234',
    id: '1234'
  },
  type: '123456789012345-AU004-1-1',
  '123456789012345-AU004-1-1': {
    'Series-837-39': {
      unit: 'mm',
      value: 65
    }
  }
};

const defaultMsg = {
  payload: {
    type: '123456789012345-AU004-1-1',
    time: '2019-07-29T12:38:38.856Z',
    series: 'Series-837-39',
    value: 65,
    unit: 'mm',
    source: '1234'
  }
};

const c8yMsg = {
  payload: {
    '123456789012345-AU004-1-1': {
      'Series-837-39': {
        value: 65,
        unit: 'mm'
      }
    },
    time: '2019-07-29T12:38:38.856Z',
    source: {
      id: '1234'
    },
    type: '123456789012345-AU004-1-1'
  }
};

const mdspMsg = {
  payload: [{ dataPointId: '1234', qualityCode: '1', value: '65' }],
  _time: new Date('2019-07-29T12:38:38.856Z')
};

const ppmpMsg = {
  payload: {
    'content-spec': 'urn:spec://eclipse.org/unide/measurement-message#v2',
    device: {
      deviceID: '1234'
    },
    measurements: [
      {
        series: {
          $_time: [0],
          'Series-837-39': [65]
        },
        ts: '2019-07-29T12:38:38.856Z'
      }
    ]
  }
};

describe('Class Measurement', () => {
  it('format to default', () => {
    const measurement = new Measurment(data);
    expect(measurement.msg).toEqual(defaultMsg);
  });
  it('should return default msg', () => {
    const measurement = new Measurment(data);
    expect(measurement.getMsg()).toEqual(defaultMsg);
  });
  it('format to c8y', () => {
    const measurement = new Measurment(data);
    const msg1 = measurement.formatC8y();
    const msg2 = measurement.getMsg('c8y');

    expect(msg1).toEqual(c8yMsg);
    expect(msg2).toEqual(c8yMsg);
  });
  it('format to mdsp', () => {
    const measurement = new Measurment(data, '1234');
    const msg1 = measurement.formatMdsp();
    const msg2 = measurement.getMsg('mdsp');

    expect(msg1).toEqual(mdspMsg);
    expect(msg2).toEqual(mdspMsg);
  });
  it('format to ppmp', () => {
    const measurement = new Measurment(data);
    const msg1 = measurement.formatPPMP();
    const msg2 = measurement.getMsg('ppmp');

    expect(msg1).toEqual(ppmpMsg);
    expect(msg2).toEqual(ppmpMsg);
  });
});
