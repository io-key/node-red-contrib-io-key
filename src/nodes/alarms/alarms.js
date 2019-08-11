module.exports = function(RED) {
  const NodeUtils = require('../../utils/NodeUtils');

  function AlarmsNode(config) {
    RED.nodes.createNode(this, config);
    NodeUtils.configureIokeyNode(RED, this, config);
  }

  RED.nodes.registerType('alarms', AlarmsNode);
};
