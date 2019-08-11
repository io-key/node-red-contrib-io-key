const RealTime = require('../../utils/RealTime');

class NodeUtils {
  static configureIokeyNode(RED, node, config) {
    if (config.auth === '') {
      node.status({
        fill: 'red',
        shape: 'dot',
        text: 'No configuration found'
      });
    } else {
      const auth = RED.nodes.getNode(config.auth);
      const realTime = new RealTime(node, config, auth);
      realTime.start();
    }
  }
}

module.exports = NodeUtils;
