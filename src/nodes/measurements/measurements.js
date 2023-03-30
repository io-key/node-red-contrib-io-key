module.exports = function (RED) {
  const NodeUtils = require('../../utils/NodeUtils');

  function MeasurementsNode(config) {
    RED.nodes.createNode(this, config);
    NodeUtils.configureIokeyNode(RED, this, config);
  }

  RED.nodes.registerType('measurements', MeasurementsNode);
};
