module.exports = function(RED) {
  const Devices = require('../../utils/Devices');
  const Credentials = require('../../utils/Credentials');
  const path = require('path');

  let node;

  function TenantConfig(n) {
    RED.nodes.createNode(this, n);
    node = this;

    node.name = n.name;

    if (node.credentials) {
      // Nodejs does not accept the autosen.cloud certificate
      try {
        node.tenant = node.credentials.tenant.replace(
          'autosen.cloud',
          'cumulocity.com'
        );
      } catch (e) {
        node.tenant = node.credentials.tenant;
      }

      node.username = node.credentials.username;
      node.password = node.credentials.password;

      node.c = new Credentials(node);
    }
  }
  RED.nodes.registerType('tenant-config', TenantConfig, {
    credentials: {
      tenant: { type: 'text' },
      username: { type: 'text' },
      password: { type: 'password' }
    }
  });

  RED.httpAdmin.get('/iokeys/sensors', function(req, res) {
    try {
      node.c
        .getEncodedCredentials()
        .then(encodedCredentials => {
          return Devices.getSensors(node.tenant, encodedCredentials);
        })
        .then(sensors => {
          res.json(sensors);
        })
        .catch(e => {
          res.json({
            code: 'unexpected_error',
            message: 'Failed to load Sensors!'
          });
        });
    } catch (e) {
      res.json({
        code: 'unexpected_error',
        message: 'Failed to load Sensors!'
      });
    }
  });
  RED.httpAdmin.get('/js/common', function(req, res) {
    const filename = path.join(__dirname, '../common.js');
    res.sendFile(filename);
  });
};
