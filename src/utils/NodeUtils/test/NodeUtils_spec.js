const NodeUtils = require('..');

describe('Node Utils', () => {
  it('should init a node', () => {
    const RED = {
      nodes: {
        getNode: jest.fn(() => ({
          tenant: 'tenant.cumulocity.com',
          username: 'tester@test.com',
          password: '1234'
        }))
      }
    };
    const node = {
      status: jest.fn(),
      on: jest.fn()
    };
    const config = {
      type: 'measurements',
      auth: 'nc'
    };

    NodeUtils.configureIokeyNode(RED, node, config);

    expect(RED.nodes.getNode).toHaveBeenCalled();
    expect(node.status).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Connecting...' })
    );
  });

  it('should set nodes status to missing configuration', () => {
    const RED = {};
    const node = {
      status: jest.fn()
    };
    const config = {
      type: 'measurements',
      auth: ''
    };

    NodeUtils.configureIokeyNode(RED, node, config);
    expect(node.status).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'No configuration found' })
    );
  });
});
