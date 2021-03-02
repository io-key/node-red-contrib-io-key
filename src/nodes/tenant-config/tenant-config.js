module.exports = function (RED) {
  const path = require('path');
  const Devices = require('../../utils/Devices');
  const Credentials = require('../../utils/Credentials');

  function TenantConfig(n) {
    RED.nodes.createNode(this, n);
    this.name = n.name;

    if (this.credentials) {
      this.tenant = this.credentials.tenant;
      this.username = this.credentials.username;
      this.password = this.credentials.password;
    }
  }
  RED.nodes.registerType('tenant-config', TenantConfig, {
    credentials: {
      tenant: { type: 'text' },
      username: { type: 'text' },
      password: { type: 'password' }
    }
  });

  RED.httpAdmin.get('/iokeys/sensors', function (req, res) {
    try {
      const node = RED.nodes.getNode(req.query.auth);
      const credentials = new Credentials(node);

      credentials
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
  RED.httpAdmin.get('/js/common', function (req, res) {
    const filename = path.join(__dirname, '../common/common.js');
    res.sendFile(filename);
  });
};
