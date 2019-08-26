function UI(node) {
  var sensors = [];

  /**
   * Loads sensors
   */
  getSensors();

  /**
   * Filters all sensors to get all sensors from one io-key
   *
   * @param  {string} iokey the name of the io-key
   */
  function filterSensors(iokey) {
    var filteredSensors = [];
    for (var i = 0; i < sensors.length; i++) {
      if (iokey === sensors[i].iokey) {
        filteredSensors.push(sensors[i]);
      }
    }

    return filteredSensors;
  }

  /**
   * Returns a specific sensor by its id
   *
   * @param  {string} id the id of the sensor
   */
  function findSensor(id) {
    for (var i = 0; i < sensors.length; i++) {
      if (id === sensors[i].id) return sensors[i];
    }
  }

  /**
   * Adds an option to a select element
   *
   * @param  {string} id the select element's id
   * @param  {string} text the text of the new option
   * @param  {string} value the value of the new option
   */
  function addOptionToSelect(id, text, value) {
    $('<option />', {
      value: value,
      text: text
    }).appendTo(id);
  }

  /**
   * Removes all options from a select element
   *
   * @param  {string} id the select element's id
   */
  function clearSelect(id) {
    $(id)
      .find('option')
      .remove();
  }

  /**
   * Checks for a specific option from the select element and selects it if it exists
   *
   * @param  {string} id the select element's id
   * @param  {string} value the value of the option
   */
  function preselectValue(id, value) {
    if ($(id + " option[value='" + value + "']").length != 0) {
      $(id).val(value);
    }
  }

  /**
   * Adds all options the io-key select element
   */
  function addIokeyOptions() {
    var iokeys = [];
    clearSelect('#node-input-iokey');

    for (var i = 0; i < sensors.length; i++) {
      if (iokeys.indexOf(sensors[i].iokey) < 0) {
        iokeys.push(sensors[i].iokey);
      }
    }

    iokeys.forEach(function(iokey) {
      addOptionToSelect('#node-input-iokey', iokey, iokey);
    });

    preselectValue('#node-input-iokey', node.device);

    addSensorOptions();
  }

  /**
   * Adds all options the sensor select element
   */
  function addSensorOptions() {
    clearSelect('#node-input-sensor');

    var iokey = $('#node-input-iokey option:selected').val();
    var filteredSensors = filterSensors(iokey);

    filteredSensors.forEach(function(sensor) {
      addOptionToSelect('#node-input-sensor', sensor.name, sensor.id);
    });

    preselectValue('#node-input-sensor', node.sensor);

    addChannelOptions();
  }

  /**
   * Adds all options the channel select element
   */
  function addChannelOptions() {
    clearSelect('#node-input-channel');

    var sensorId = $('#node-input-sensor option:selected').val();
    var sensor = findSensor(sensorId);
    if (!sensor) return;

    sensor.channels.forEach(function(channel) {
      addOptionToSelect('#node-input-channel', channel, channel);
    });

    preselectValue('#node-input-channel', node.channel);
  }

  function hideElement(id) {
    $(id).css({
      display: 'none'
    });
  }

  function displayElement(id) {
    $(id).css({
      display: 'block'
    });
  }

  /**
   * Request all sensors from the node
   */
  function getSensors() {
    clearSelect('#node-input-iokey');
    addOptionToSelect('#node-input-iokey', 'Loading...', '');

    try {
      $.getJSON('/iokeys/sensors', { auth: node.auth }, function(_sensors) {
        sensors = _sensors;

        if (sensors.length > 0) {
          addIokeyOptions();
        } else {
          clearSelect('#node-input-iokey');
          addOptionToSelect('#node-input-iokey', 'No io-keys found', '');
        }
      });
    } catch (e) {
      clearSelect('#node-input-iokey');
      addOptionToSelect('#node-input-iokey', 'No io-keys found', '');
    }
  }

  /**
   * Adds an on change handler to the auth select
   */
  var initialLoad = true;
  $('#node-input-auth').on('change', function(event) {
    var value = $('#node-input-auth option:selected').val();
    if (value === '' || typeof value === 'undefined') return;

    if (value !== node.auth) {
      clearSelect('#node-input-iokey');
      clearSelect('#node-input-sensor');
      clearSelect('#node-input-channel');
    } else {
      if (initialLoad === false) {
        addIokeyOptions();
      }
    }

    initialLoad = false;
  });

  /**
   * Adds an on change handler to the io-key select
   */
  $('#node-input-iokey').on('change', function(event) {
    var value = $('#node-input-iokey option:selected').val();
    if (value === '' || typeof value === 'undefined') return;

    addSensorOptions();
  });

  /**
   * Adds an on change handler to the sensor select
   */
  $('#node-input-sensor').on('change', function(event) {
    var value = $('#node-input-sensor option:selected').val();
    if (value === '' || typeof value === 'undefined') return;

    addChannelOptions();
  });

  function toggleDatapointIdSelect() {
    var value = $('#node-input-format option:selected').val();
    if (value === '' || typeof value === 'undefined') return;

    if (value === 'mdsp') {
      displayElement('#div-datapointId');
    } else {
      hideElement('#div-datapointId');
    }
  }

  /**
   * Adds an on change handler to the format select
   */
  $('#node-input-format').on('change', function(event) {
    toggleDatapointIdSelect();
  });

  toggleDatapointIdSelect();
}
