const Measurment = require('..');

const data = {
  'AT001-1': { 'Series-837-6': { unit: '°C', value: 24 } },
  self: 'http://t1451181579.cumulocity.com/measurement/measurements/1624025',
  time: '2023-03-30T11:22:27.528Z',
  id: '1624025',
  source: {
    self: 'http://t1451181579.cumulocity.com/inventory/managedObjects/1207342',
    id: '1234'
  },
  type: 'Series-837-6'
};

const defaultMsg = {
  payload: {
    type: 'AT001-1',
    time: '2023-03-30T11:22:27.528Z',
    series: 'Series-837-6',
    value: 24,
    unit: '°C',
    source: '1234'
  }
};

const c8yMsg = {
  payload: {
    'AT001-1': {
      'Series-837-6': {
        value: 24,
        unit: '°C'
      }
    },
    time: '2023-03-30T11:22:27.528Z',
    source: {
      id: '1234'
    },
    type: 'AT001-1'
  }
};

const mdspMsg = {
  payload: [{ dataPointId: '1234', qualityCode: '1', value: '24' }],
  _time: new Date('2023-03-30T11:22:27.528Z')
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
          'Series-837-6': [24]
        },
        ts: '2023-03-30T11:22:27.528Z'
      }
    ]
  }
};

describe('Class Measurement', () => {
  it('format to default', () => {
    const measurement = new Measurment(data, null, 'AT001-1');
    expect(measurement.msg).toEqual(defaultMsg);
  });
  it('should return default msg', () => {
    const measurement = new Measurment(data, null, 'AT001-1');
    expect(measurement.getMsg()).toEqual(defaultMsg);
  });
  it('format to c8y', () => {
    const measurement = new Measurment(data, null, 'AT001-1');
    const msg1 = measurement.formatC8y();
    const msg2 = measurement.getMsg('c8y');

    expect(msg1).toEqual(c8yMsg);
    expect(msg2).toEqual(c8yMsg);
  });
  it('format to mdsp', () => {
    const measurement = new Measurment(data, '1234', 'AT001-1');
    const msg1 = measurement.formatMdsp();
    const msg2 = measurement.getMsg('mdsp');

    expect(msg1).toEqual(mdspMsg);
    expect(msg2).toEqual(mdspMsg);
  });
  it('format to ppmp', () => {
    const measurement = new Measurment(data, null, 'AT001-1');
    const msg1 = measurement.formatPPMP();
    const msg2 = measurement.getMsg('ppmp');

    expect(msg1).toEqual(ppmpMsg);
    expect(msg2).toEqual(ppmpMsg);
  });
});
