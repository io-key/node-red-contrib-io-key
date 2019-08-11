module.exports = function(RED) {
  const NodeUtils = require('../../utils/NodeUtils');

  function EventsNode(config) {
    RED.nodes.createNode(this, config);
    NodeUtils.configureIokeyNode(RED, this, config);
  }

  RED.nodes.registerType('events', EventsNode);
};
