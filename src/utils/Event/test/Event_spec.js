const Event = require('..');

const data = {
  realtimeAction: 'CREATE',
  data: {
    creationTime: '2019-08-02T09:46:58.652Z',
    self: 'http://tenant.cumulocity.com/event/events/968074',
    source: {
      name: 'AU004',
      self: 'http://tenant.cumulocity.com/inventory/managedObjects/1234',
      id: '1234'
    },
    time: '2019-08-01T19:10:28.845Z',
    text: 'A event was triggered',
    id: '968074',
    type: 'test_event_123456789012345-AU004-1-1'
  }
};

const defaultMsg = {
  payload: {
    action: 'CREATE',
    source: '1234',
    time: '2019-08-01T19:10:28.845Z',
    text: 'A event was triggered',
    id: '968074',
    type: 'test_event_123456789012345-AU004-1-1'
  }
};

const c8yMsg = {
  payload: {
    type: 'test_event_123456789012345-AU004-1-1',
    time: '2019-08-01T19:10:28.845Z',
    text: 'A event was triggered',
    source: { id: '1234' }
  }
};

const mdspMsg = {
  payload: {
    sourceType: 'Agent',
    sourceId: 'application',
    source: '1234',
    severity: 40, // 0-99 : 20:error, 30:warning, 40: information
    description: 'A event was triggered',
    timestamp: '2019-08-01T19:10:28.845Z'
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
        ts: '2019-08-01T19:10:28.845Z',
        description: 'A event was triggered',
        severity: 'LOW',
        type: 'DEVICE',
        origin: 'test_event_123456789012345-AU004-1-1'
      }
    ]
  }
};

describe('Class Event', () => {
  it('format to default', () => {
    const event = new Event(data);
    expect(event.msg).toEqual(defaultMsg);
  });
  it('should return default', () => {
    const event = new Event(data);
    const msg = event.getMsg();
    expect(msg).toEqual(defaultMsg);
  });
  it('format to c8y', () => {
    const event = new Event(data);
    const msg1 = event.formatC8y();
    const msg2 = event.getMsg('c8y');

    expect(msg1).toEqual(c8yMsg);
    expect(msg2).toEqual(c8yMsg);
  });
  it('format to mdsp', () => {
    const event = new Event(data);
    const msg1 = event.formatMdsp();
    const msg2 = event.getMsg('mdsp');

    expect(msg1).toEqual(mdspMsg);
    expect(msg2).toEqual(mdspMsg);
  });
  it('format to ppmp', () => {
    const event = new Event(data);
    const msg1 = event.formatPPMP();
    const msg2 = event.getMsg('ppmp');

    expect(msg1).toEqual(ppmpMsg);
    expect(msg2).toEqual(ppmpMsg);
  });
});
