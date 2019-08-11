# node-red-contrib-iokey

## Node-RED Connector for the [io-key](https://autosen.com/de/io-key)

This collection of nodes contains three nodes to receive measurements, alarms and events from a sensor connected to an io-key.
​

## Installing the node

```bash
# change to your ~/.node-red/ folder
cd ~/.node-red/
npm install node-red-contrib-io-key
```

## Node-RED - Manage Palette Installation

You can also install the node via the manage palette feature in the Node-RED administration UI.

## How to use the Node-RED node

### Step 1: Connect an io-key with at least one sensor to your cloud

### ​Step 2: Create and deploy the flow

- Add a measurement, alarm or event node to your flow
- Add your tenant-config and enter your hostname, username and password
- Now you need to deploy the flow so that the measurement node can fetch the list of io-keys
- Open the node configuration again and choose your io-key and sensors from the dropdowns
- Select your preferred format and deploy your flow again
- You should now receive measurements, alarms or events from your io-key ​

#### Formats

Each node can output your data in the following formats:
​

- Default: The node will return a plain object with all required data
- Cumulocity: The node will return a format which can be used to send the data directly to the cumulocity cloud
  ​

  - https://cumulocity.com/guides/reference/measurements/
  - https://cumulocity.com/guides/reference/alarms/
  - https://cumulocity.com/guides/reference/events/

* MindSphere: The node will return a format which can be used together with the [MindConnect](https://flows.nodered.org/node/@mindconnect/node-red-contrib-mindconnect) node to send data to MindSphere

* PPMP: The node will output a standardized PPMP message

  - [Measurement Message](https://www.eclipse.org/unide/specification/v2/measurement-message/#messageDetail) - for measurments
  - [Machine Message](https://www.eclipse.org/unide/specification/v2/machine-message#messageDetail) - for alarms and events

## Demo flows

Demo flows are available at /examples
​

## License

[MIT](http://vjpr.mit-license.org)
