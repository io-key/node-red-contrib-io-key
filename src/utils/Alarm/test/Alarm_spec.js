const Alarm = require('..');

const data = {
  realtimeAction: 'UPDATE',
  data: {
    severity: 'CRITICAL',
    creationTime: '2019-07-31T15:23:04.456Z',
    count: 1,
    self: 'https://tenant.cumulocity.com/alarm/alarms/887727',
    history: {
      auditRecords: [],
      self: 'https://tenant.cumulocity.com/audit/auditRecords'
    },
    source: {
      self: 'https://tenant.cumulocity.com/inventory/managedObjects/1234',
      id: '1234'
    },
    time: '2019-07-31T15:23:04.289Z',
    text: 'Threshold exceeded',
    id: '887727',
    type: 'c8y_Threshold_123456789012345-AU004-1-1',
    status: 'CLEARED'
  }
};

const defaultMsg = {
  payload: {
    action: 'UPDATE',
    severity: 'CRITICAL',
    time: '2019-07-31T15:23:04.289Z',
    text: 'Threshold exceeded',
    id: '887727',
    type: 'c8y_Threshold_123456789012345-AU004-1-1',
    status: 'CLEARED',
    source: '1234'
  }
};

const c8yMsg = {
  payload: {
    type: 'c8y_Threshold_123456789012345-AU004-1-1',
    time: '2019-07-31T15:23:04.289Z',
    text: 'Threshold exceeded',
    status: 'CLEARED',
    severity: 'CRITICAL',
    source: { id: '1234' }
  }
};

const mdspMsg = {
  payload: {
    sourceType: 'Agent',
    sourceId: 'application',
    source: '1234',
    severity: 20, // 0-99 : 20:error, 30:warning, 40: information
    description: 'Threshold exceeded',
    timestamp: '2019-07-31T15:23:04.289Z',
    acknowledged: false
  }
};

const ppmpMsg = {
  payload: {
    'content-spec': 'urn:spec://eclipse.org/unide/machine-message#v2',
    device: {
      deviceID: '1234'
    },
    messages: [
      {
        ts: '2019-07-31T15:23:04.289Z',
        description: 'Threshold exceeded',
        severity: 'HIGH',
        type: 'DEVICE',
        origin: 'c8y_Threshold_123456789012345-AU004-1-1',
        type: 'DEVICE'
      }
    ]
  }
};

describe('Class Alarm', () => {
  it('format to default', () => {
    const alarm = new Alarm(data);
    expect(alarm.msg).toEqual(defaultMsg);
  });
  it('should return default msg', () => {
    const alarm = new Alarm(data);
    expect(alarm.getMsg()).toEqual(defaultMsg);
  });
  it('format to c8y', () => {
    const alarm = new Alarm(data);
    const msg1 = alarm.formatC8y();
    const msg2 = alarm.getMsg('c8y');

    expect(msg1).toEqual(c8yMsg);
    expect(msg2).toEqual(c8yMsg);
  });
  it('format to mdsp', () => {
    const alarm = new Alarm(data);
    const msg1 = alarm.formatMdsp();
    const msg2 = alarm.getMsg('mdsp');

    expect(msg1).toEqual(mdspMsg);
    expect(msg2).toEqual(mdspMsg);
  });
  it('format to ppmp', () => {
    const alarm = new Alarm(data);
    const msg1 = alarm.formatPPMP();
    const msg2 = alarm.getMsg('ppmp');

    expect(msg1).toEqual(ppmpMsg);
    expect(msg2).toEqual(ppmpMsg);
  });
});
