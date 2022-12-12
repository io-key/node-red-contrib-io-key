const RealTime = require('../RealTimeApi/HTTP');
const RealTimeWs = require('../RealTimeApi/Websocket');

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
      let realTime = null;
      if (config.connection === 'longPolling') {
        realTime = new RealTime(node, config, auth);
      } else {
        realTime = new RealTimeWs(node, config, auth);
      }
      realTime.start();
    }
  }
}

module.exports = NodeUtils;
