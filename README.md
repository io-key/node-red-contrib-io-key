# node-red-contrib-iokey

## Node-RED Connector for the [io-key](https://autosen.com/de/io-key)

![node-red-contrib-mindconnect](images/iokey_logo.png)

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

## Example flows

## Mindsphere Communication

This flow establishes a connection to the mindsphere via the mindconnect node.

## Getting Started

### Step 1: Import Flow

- Import the Node-RED flow from below

### Step 2: Set up Mindsphere

- Create a mindsphere asset
- Generate an onboard token
- Copy the onboard token into the mindconnect node

### Step 2: Test it

- Now you have successfully set up your Azure Communication

### Flow:

```json
[
  {
    "id": "47ce5615.772208",
    "type": "tab",
    "label": "Minsphere",
    "disabled": false,
    "info": ""
  },
  {
    "id": "3287aa3d.50b3f6",
    "type": "measurements",
    "z": "47ce5615.772208",
    "name": "",
    "auth": "",
    "device": "",
    "sensor": "",
    "channel": "",
    "format": "none",
    "datapoint": "",
    "x": 120,
    "y": 60,
    "wires": [["e626f459.8dcdc8"]]
  },
  {
    "id": "e626f459.8dcdc8",
    "type": "mindconnect",
    "z": "47ce5615.772208",
    "name": "",
    "configtype": "SHARED_SECRET",
    "agentconfig": "",
    "privatekey": "",
    "model": "",
    "validate": true,
    "validateevent": true,
    "chunk": false,
    "disablekeepalive": false,
    "retry": 3,
    "parallel": 1,
    "x": 450,
    "y": 60,
    "wires": [[]]
  }
]
```

## Push-Notification Example

This demonstration flow is used to check whether temperature thresholds have been exceeded.
If this is the case, a push notification is sent to the configured smartphone.
(A limit of one notification per minute has been set)

## Getting Started

### Step 1: Import the flow into your Node-RED flow

- Select _import_ in the upper right menu
- Select _Clipboard_
- Copy the JSON from _push-notification-flow.json_ into the Node-RED modal

### Step 2: Download the Pushover app for receiving Push-Notifications

- Go to Google Play Store or Apple App Store and download the app: _Pushover_
- Create an account
- Verify your e-mail and login [here](https://pushover.net/)
- Scroll down until you see a table called _Your Application_
- Create a new application
- After the successfull creation of a new application you will see a API Token. Copy it.

### Step 3: Install the Node-Red Pushover Node

- Open "Manage palette" in the Node-RED Menü
- Select _Install_
- Search for "node-red-contrib-pushover"
- Click install

### Step 4: Connect Node-RED and Pushover

- Open the Pushover-Node
- Create a new key
- Copy your API Token into the field _Token_
- Copy your User Key from the main page of Pushover into the field _User_
- [optinal] Enter a name of your key into the field name
- Save your key

### Step 5: Test it

- Now you have successfully set up your Push-Notification-Flow. Just send values which are higher then 25 with your io key or adjust the flow for your own thresholds.

### Flow:

```json
[
  {
    "id": "cb8a1fee.fc79e",
    "type": "tab",
    "label": "Push-Notifications",
    "disabled": false,
    "info": ""
  },
  {
    "id": "ff80110a.bbf1b",
    "type": "measurements",
    "z": "cb8a1fee.fc79e",
    "name": "",
    "auth": "",
    "device": "",
    "sensor": "",
    "channel": "",
    "format": "none",
    "datapoint": "",
    "x": 121,
    "y": 417.69099617004395,
    "wires": [
      [
        "6474c00d.0a9b",
        "56020173.dcd22",
        "b1dd7ed5.910ab",
        "75f8c985.47c648",
        "1922e31e.0feddd",
        "8befdcb8.87eba"
      ]
    ]
  },
  {
    "id": "e9acaa50.e2a9f8",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": "Controll condition and hysteresis",
    "func": "const hysteresisMet = flow.get('hysteresisMet25')||false;\n\nlet data = {}\ndata.payload=`Slight overtemperature at the motor. (${msg.payload.value} °C)`\ndata.topic=\"M1-A343\"\ndata.priority=-1\n\nif(msg.payload.condition && hysteresisMet){\n    flow.set('hysteresisMet25', false);\n    return data\n}\n",
    "outputs": 1,
    "noerr": 0,
    "x": 861.5207366943359,
    "y": 266.9237251281738,
    "wires": [["ae84aeec.757c"]]
  },
  {
    "id": "8befdcb8.87eba",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": ">=25",
    "func": "\n\n\n\n\nif(msg.payload.value>=25 && msg.payload.value<35){\n    msg.payload.condition=true\n   \n}else{\n    msg.payload.condition=false\n}\nreturn msg ",
    "outputs": 1,
    "noerr": 0,
    "x": 566.0171966552734,
    "y": 266.0104503631592,
    "wires": [["e9acaa50.e2a9f8"]],
    "inputLabels": ["Actual Value"],
    "icon": "node-red-dashboard/ui_numeric.png"
  },
  {
    "id": "6474c00d.0a9b",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": ">=35",
    "func": "if(msg.payload.value>=35 && msg.payload.value<45){\n    msg.payload.condition=true\n   \n}else{\n    msg.payload.condition=false\n}\nreturn msg ",
    "outputs": 1,
    "noerr": 0,
    "x": 565.0173225402832,
    "y": 428.0103931427002,
    "wires": [["bb4a0aff.247518"]],
    "inputLabels": ["Actual Value"],
    "icon": "node-red-dashboard/ui_numeric.png"
  },
  {
    "id": "56020173.dcd22",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": ">=45",
    "func": "if(msg.payload.value>45){\n    msg.payload.condition=true\n   \n}else{\n    msg.payload.condition=false\n}\nreturn msg ",
    "outputs": 1,
    "noerr": 0,
    "x": 559.0173263549805,
    "y": 588.0104846954346,
    "wires": [["1b61c824.d21108"]],
    "inputLabels": ["Actual Value"],
    "icon": "node-red-dashboard/ui_numeric.png"
  },
  {
    "id": "c1b421e7.c43f4",
    "type": "comment",
    "z": "cb8a1fee.fc79e",
    "name": "Flow Description",
    "info": "This flow is used to check whether temperature\nthresholds have been exceeded. If this is the \ncase, a push notification is sent to the configured\nsmartphone. (A limit of one notification per minute has been set)",
    "x": 131.52429962158203,
    "y": 149.92015838623047,
    "wires": []
  },
  {
    "id": "1922e31e.0feddd",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": "Hysteresis 10 %",
    "func": "\n\nconst value = msg.payload.value\nconst HYSTERESIS = 10 // %\nconst THRESHOLD = 25 // °C\n\n\n\nif(value < THRESHOLD * (1- HYSTERESIS/100) ){\n    flow.set('hysteresisMet25', true);\n}",
    "outputs": 1,
    "noerr": 0,
    "x": 537.9062347412109,
    "y": 210.34382438659668,
    "wires": [[]]
  },
  {
    "id": "75f8c985.47c648",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": "Hysteresis 10 %",
    "func": "\n\nconst value = msg.payload.value\nconst HYSTERESIS = 10 // %\nconst THRESHOLD = 35 // °C\n\n\n\n\nif(value < THRESHOLD * (1- HYSTERESIS/100) ){\n    flow.set('hysteresisMet35', true);\n}",
    "outputs": 1,
    "noerr": 0,
    "x": 534.0173645019531,
    "y": 382.0104064941406,
    "wires": [[]]
  },
  {
    "id": "b1dd7ed5.910ab",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": "Hysteresis 10 %",
    "func": "\n\nconst value = msg.payload.value\nconst HYSTERESIS = 10 // %\nconst THRESHOLD = 45 // °C\n\n\n\n\nif(value < THRESHOLD * (1- HYSTERESIS/100) ){\n    flow.set('hysteresisMet45', true);\n}",
    "outputs": 1,
    "noerr": 0,
    "x": 534.0173721313477,
    "y": 541.0103950500488,
    "wires": [[]]
  },
  {
    "id": "bb4a0aff.247518",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": "Controll condition and hysteresis",
    "func": "const hysteresisMet = flow.get('hysteresisMet35')||false;\n\nlet data = {}\ndata.payload=`Slight overtemperature at the motor. (${msg.payload.value} °C)`\ndata.topic=\"M1-A343\"\ndata.priority=-1\n\nif(msg.payload.condition && hysteresisMet){\n    flow.set('hysteresisMet35', false);\n    return data\n}\n",
    "outputs": 1,
    "noerr": 0,
    "x": 863.017333984375,
    "y": 426.0104064941406,
    "wires": [["ae84aeec.757c"]]
  },
  {
    "id": "1b61c824.d21108",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": "Controll condition and hysteresis",
    "func": "const hysteresisMet = flow.get('hysteresisMet45')||false;\n\nlet data = {}\ndata.payload=`Slight overtemperature at the motor. (${msg.payload.value} °C)`\ndata.topic=\"M1-A343\"\ndata.priority=-1\n\nif(msg.payload.condition && hysteresisMet){\n    flow.set('hysteresisMet45', false);\n    return data\n}\n",
    "outputs": 1,
    "noerr": 0,
    "x": 861.017333984375,
    "y": 591.0104370117188,
    "wires": [["ae84aeec.757c"]]
  },
  {
    "id": "ae84aeec.757c",
    "type": "function",
    "z": "cb8a1fee.fc79e",
    "name": "LimitPerMinute = 1",
    "func": "\nlet lastSend = context.get('lastSend')||0;\nlet currentTimestamp = new Date().getTime();\n\n//  Calculate difference between last and latest notification\nlet diffMilli = Math.abs(currentTimestamp - lastSend)\n\n// Convert milliseconds into minutes\nlet diffMin = diffMilli/(1000*60)\n  \n  \nif(diffMin > 1){\n    context.set('lastSend', currentTimestamp);\n    return msg;\n}",
    "outputs": 1,
    "noerr": 0,
    "x": 1261.0695266723633,
    "y": 435.2292881011963,
    "wires": [["3de6ef84.6cd47"]]
  },
  {
    "id": "3de6ef84.6cd47",
    "type": "pushover api",
    "z": "cb8a1fee.fc79e",
    "keys": "",
    "title": "",
    "name": "",
    "x": 1548.1667098999023,
    "y": 432.6666793823242,
    "wires": []
  }
]
```

## Dual Silo Monitoring Example

In this showcase two io-keys are used to monitor two silos. The sensor readings are converted to liters and the flow adds up the fill levels of both silos. If the total material is too low the flow sends an email to notify the supplier.

## Getting Started

### Step 1: Configuration

- `Sensor Value to Meters`-Nodes: Adjust the formula so that the node outputs meters. - For example, if your sensor readings are in cm you need to divide by 100.
- `Calculate Fill Level`-Nodes: Adjust the constants `SENSOR_MOUNT_HEIGHT` and `SILO_DIAMETER` to match your silo's physical dimensions. You can also adjust the formula if your silo is not cylindrical.
- `Check if Empty`-Node: Adjust the constants `THRESHOLD` and `HYSTERESIS`. If the fill level is below the threshold an email is sent.
- `email`-Node: Setup your mail server and the recipient

### Step 2: Test it

- Now you have successfully set up your Silo Monitoring flow. Just use the transferred data from the io key sensor or select the test data inject input to run the flow with test data.

### Flow:

```json
[{"id":"c46e8f2c.3e845","type":"tab","label":"Silo","disabled":false,"info":""},{"id":"454dd216.7894fc","type":"measurements","z":"c46e8f2c.3e845","name":"","auth":"","device":"device_io-key-357142090031740","sensor":"869876","channel":"357142090031740-AU004-1-1","format":"none","datapoint":"","x":238.0000057220459,"y":650.0000066757202,"wires":[["c60c5431.a41498"]]},{"id":"ab1ceac2.abe4a8","type":"measurements","z":"c46e8f2c.3e845","name":"","auth":"","device":"","format":"none","datapoint":"","x":238.0000057220459,"y":370.0000066757202,"wires":[["48407452.a9a02c"]]},{"id":"cb08964a.e8aa98","type":"comment","z":"c46e8f2c.3e845","name":"Silo 1","info":"","x":208.0000057220459,"y":250.00000667572021,"wires":[]},{"id":"f641eb2c.b50d48","type":"comment","z":"c46e8f2c.3e845","name":"Silo 2","info":"","x":208.0000057220459,"y":530.0000066757202,"wires":[]},{"id":"96f95f57.c97ff","type":"function","z":"c46e8f2c.3e845","name":"Calculate Fill Level","func":"//    Silo\n//    +--+--+\n//    |  |  |\n//    |  + <----+ Distance Sensor\n//    |     |\n//    |     |\n//    +-----+\n//    |-----| <-+ Material\n//    |-----| \n//    +-----+\n\n// Settings\nconst SENSOR_MOUNT_HEIGHT = 2.0; // m\nconst SILO_DIAMETER = 4.0; //m\n\n// Calculations\nconst fillHeight = SENSOR_MOUNT_HEIGHT - msg.payload;\nconst fillLevel = fillHeight * Math.pow(SILO_DIAMETER/2, 2) * 1000; \n\nconst newMsg = { payload: fillLevel};\nreturn newMsg;","outputs":1,"noerr":0,"x":488.0000057220459,"y":450.0000066757202,"wires":[["528bbc25.7324e4"]]},{"id":"48407452.a9a02c","type":"function","z":"c46e8f2c.3e845","name":"Sensor Value to Meters","func":"msg.payload = msg.payload.value / 100;\nreturn msg;","outputs":1,"noerr":0,"x":408.0000057220459,"y":410.0000066757202,"wires":[["96f95f57.c97ff"]]},{"id":"c60c5431.a41498","type":"function","z":"c46e8f2c.3e845","name":"Sensor Value to Meters","func":"msg.payload = msg.payload.value / 1000;\nreturn msg;","outputs":1,"noerr":0,"x":408.0000057220459,"y":690.0000066757202,"wires":[["86e51011.cc09b"]]},{"id":"86e51011.cc09b","type":"function","z":"c46e8f2c.3e845","name":"Calculate Fill Level","func":"//    Silo\n//    +--+--+\n//    |  |  |\n//    |  + <----+ Distance Sensor\n//    |     |\n//    |     |\n//    +-----+\n//    |-----| <-+ Material\n//    |-----| \n//    +-----+\n\n// Settings\nconst SENSOR_MOUNT_HEIGHT = 0.4; // m\nconst SILO_DIAMETER = 3; //m\n\n// Calculations\nconst fillHeight = SENSOR_MOUNT_HEIGHT - msg.payload;\nconst fillLevel = fillHeight * Math.pow(SILO_DIAMETER/2, 2) * 1000; \n\nconst newMsg = { payload: fillLevel};\nreturn newMsg;","outputs":1,"noerr":0,"x":488.0000057220459,"y":730.0000066757202,"wires":[["fa08d5c9.3a7228"]]},{"id":"528bbc25.7324e4","type":"change","z":"c46e8f2c.3e845","name":"","rules":[{"t":"set","p":"Silo1","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":558.0000057220459,"y":490.0000066757202,"wires":[["4c195b31.a320e4"]]},{"id":"4c195b31.a320e4","type":"change","z":"c46e8f2c.3e845","name":"sum","rules":[{"t":"set","p":"payload","pt":"msg","to":"$flowContext('Silo1')+$flowContext('Silo2')","tot":"jsonata"}],"action":"","property":"","from":"","to":"","reg":false,"x":748.0000057220459,"y":630.0000066757202,"wires":[["abc39c3b.f8d04"]]},{"id":"fa08d5c9.3a7228","type":"change","z":"c46e8f2c.3e845","name":"","rules":[{"t":"set","p":"Silo2","pt":"flow","to":"payload","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":558.0000057220459,"y":770.0000066757202,"wires":[["4c195b31.a320e4"]]},{"id":"abc39c3b.f8d04","type":"rbe","z":"c46e8f2c.3e845","name":"","func":"rbe","gap":"","start":"","inout":"out","property":"payload","x":788.0000057220459,"y":670.0000066757202,"wires":[["9e398b9b.aacba8"]]},{"id":"8f36a9be.6c5a58","type":"e-mail","z":"c46e8f2c.3e845","server":"","port":"465","secure":true,"name":"","dname":"","x":968.0000057220459,"y":790.0000066757202,"wires":[]},{"id":"a9cc45d.c92a3b8","type":"inject","z":"c46e8f2c.3e845","name":"Inject Test Data: Full","topic":"","payload":"{\"value\": 50}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":248.0000057220459,"y":570.0000066757202,"wires":[["c60c5431.a41498"]]},{"id":"9c81119.bab43f","type":"inject","z":"c46e8f2c.3e845","name":"Inject Test Data: Empty","topic":"","payload":"{\"value\": 400}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":258.0000057220459,"y":610.0000066757202,"wires":[["c60c5431.a41498"]]},{"id":"33e17062.3767a","type":"inject","z":"c46e8f2c.3e845","name":"Inject Test Data: Full","topic":"","payload":"{\"value\": 25}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":248.0000057220459,"y":290.0000066757202,"wires":[["48407452.a9a02c"]]},{"id":"607c50b5.49dd5","type":"inject","z":"c46e8f2c.3e845","name":"Inject Test Data: Empty","topic":"","payload":"{\"value\":195}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":258.0000057220459,"y":330.0000066757202,"wires":[["48407452.a9a02c"]]},{"id":"9e398b9b.aacba8","type":"function","z":"c46e8f2c.3e845","name":"Check if Empty","func":"// Settings\nconst THRESHOLD = 500.0; // 500 liters is threashold for email\nconst HYSTERESIS = 10.0; // hysteresis in percent\nconst STORE = \"mailHystersisOk\";\n\n// Hysteresis\nif (msg.payload > THRESHOLD * (1+HYSTERESIS/100)) {\n    context.set(STORE, true);\n} \n// Compare if empty\nif (msg.payload <= THRESHOLD && context.get(STORE)) {\n    context.set(STORE, false)\n    return msg;\n} else {\n    return null;\n}\n\n\n\n","outputs":1,"noerr":0,"x":858.0000057220459,"y":710.0000066757202,"wires":[["23e3b1bc.28476e"]]},{"id":"23e3b1bc.28476e","type":"function","z":"c46e8f2c.3e845","name":"Mail","func":"const mail = {};\n\nmail.topic = \"New Order\"\nmail.payload = `Dear Mr. Musterman,\n\ni would like to order a new batch of ${Math.round(2000 - msg.payload)} liters to our \nMunich location.\n\nBest regards,\nAnna Accounting\n`;\nreturn mail;","outputs":1,"noerr":0,"x":948.0000057220459,"y":750.0000066757202,"wires":[["8f36a9be.6c5a58"]]},{"id":"f98d3488.b51358","type":"comment","z":"c46e8f2c.3e845","name":"Flow Description","info":"In this example two io-keys are used to monitor\ntwo silos. The sensor readings are converted to\nliters and the flow adds up the fill levels of both\nsilos. If the total material is too low the flow\nsends an email to notify the supplier.","x":232.16669273376465,"y":152.66667413711548,"wires":[
```

## Microsoft Azure Communication

This flow establishes a connection to the azure cloud via mqtt.

## Getting Started

### Step 1: Set up Azure

- Create a new device on your Azure IoT Hub
- Generate your device's SAS token
- Enter your device credentials in the mqtt node:
  _ Create a server configuration:
  _ In the connection tab add the following values
  _ Server: `{your iothubhostname}`
  _ TLS: Activate checkbox
  _ Client-ID: `{your device_id}`
  _ In the security tab add the following values
  _ Username: `{your iothubhostname}/{your device_id}/?api-version=2018-06-30`
  _ Password: `{SAS}`
  - Back the main tab of the mqtt node enter your topic:
    - Topic: `devices/{your devicename}/messages/events/`

### Step 2: Test it

- Now you have successfully set up your Azure Communication

### Flow:

```json
[
  {
    "id": "cf0985f9.a4cf68",
    "type": "tab",
    "label": "Azure",
    "disabled": false,
    "info": ""
  },
  {
    "id": "48ca0ad7.46ead4",
    "type": "mqtt out",
    "z": "cf0985f9.a4cf68",
    "name": "",
    "topic": "",
    "qos": "1",
    "retain": "false",
    "broker": "",
    "x": 500.00001525878906,
    "y": 351.0000104904175,
    "wires": []
  },
  {
    "id": "74973997.753bb8",
    "type": "measurements",
    "z": "cf0985f9.a4cf68",
    "name": "",
    "auth": "",
    "device": "device_io-key-357142090031740",
    "sensor": "869876",
    "channel": "357142090031740-AU004-1-1",
    "format": "none",
    "datapoint": "",
    "x": 290.00001525878906,
    "y": 351.0000104904175,
    "wires": [["48ca0ad7.46ead4"]]
  },
  {
    "id": "f7d01b48.8698d8",
    "type": "comment",
    "z": "cf0985f9.a4cf68",
    "name": "Flow Description",
    "info": "This flow establishes a connection to the \nAzure cloud via MQTT.",
    "x": 294.1666717529297,
    "y": 240.66669273376465,
    "wires": []
  }
]
```

## AWS Flow

With this flow sensor data can be directly published via MQTT to an AWS IOT Broker.

## Getting Started

### Step 1: Create a AWS Thing/Device

- Select the AWS _IoT Core_ service
- Create your AWS Thing with a suitable policy
- Download all required certifications and keys

### Step 2: Configurate the MQTT node

- Select the _mqtt_ node
- Add a new server
- Enter your server address and the following port: _8883_
- Check _Enable secure (SSL/TLS) connection_
- Add a new TLS configuration and upload the Certificate, Private Key, CA Certificate from you AWS IOT Broker
- After clicking on update the node should successfully connect with your broker

### Flow:

```json
[
  {
    "id": "85547a1.b984788",
    "type": "tab",
    "label": "AWS",
    "disabled": false,
    "info": ""
  },
  {
    "id": "cb2d26c8.7703d8",
    "type": "measurements",
    "z": "85547a1.b984788",
    "name": "",
    "auth": "",
    "device": "device_io-key-357142090032045",
    "sensor": "887565",
    "channel": "357142090032045-AL002-1-1",
    "format": "none",
    "datapoint": "",
    "x": 301.0174026489258,
    "y": 300.0103988647461,
    "wires": [["e9449efb.24ad7"]]
  },
  {
    "id": "cf25cafd.54f178",
    "type": "comment",
    "z": "85547a1.b984788",
    "name": "Flow Description",
    "info": "With this flow sensor data can be directly published\nvia MQTT.",
    "x": 302.0173645019531,
    "y": 204.01043033599854,
    "wires": []
  },
  {
    "id": "e9449efb.24ad7",
    "type": "mqtt out",
    "z": "85547a1.b984788",
    "name": "",
    "topic": "",
    "qos": "",
    "retain": "",
    "broker": "",
    "x": 610.0693817138672,
    "y": 299.4965190887451,
    "wires": []
  }
]
```

## Amazon Alexa Example

With this flow you can activate or deactivate the data transfer to a cloud platform (here mindsphere) via alexa spoken command.
This is an small example how to interact with Alexa in your Node-RED flow.
For deeper functions alexa skills are needed. You find more information to this topic [here](https://developer.amazon.com/de/alexa-skills-kit/?sc_category=paid&sc_channel=sem&sc_campaign=SEM-GO%7CNon-Brand%7CAll%7CREG%7CProfessional_Developer%7CEvergreen%7CIT%7CItalian%7CText%7Ccoding_language&sc_publisher=GO&sc_content=content&sc_detail=322783149505&sc_funnel=convert&sc_country=DE&sc_keyword=alexa%20skills%20entwickeln&sc_place=&sc_trackingcode=e&sc_segment=build_alexa_skill_e&sc_medium=paid%7Csem%7CSEM-GO%7CNon-Brand%7CAll%7CREG%7CProfessional_Developer%7CEvergreen%7CIT%7CItalian%7CText%7Ccoding_language%7CGO%7Ccontent%7C322783149505%7Cconvert%7CDE%7Calexa%20skills%20entwickeln%7C%7Ce%7Cbuild_alexa_skill_e)

## Getting Started

### Step 1: Download the Amazon Alexa app

- Search for new devices
- Select the _IO Key Data Transfer_ device

### Step 2: Install required modules

- Navigate to the manage palette in Node-RED and install the following modules
- _@mindconnect/node-red-contrib-mindconnect_
- _node-red-contrib-alexa-local_
- Copy you Agent Configuration into the mindconnect node

### Step 3: Test it

- Now you should be able to control alexa via your voice. For example: "Alexa turn IO Key Data Transfer on/off"

### Flow:

```json
[
  {
    "id": "8f390e05.0dcbf",
    "type": "tab",
    "label": "Alexa/Mindsphere",
    "disabled": false,
    "info": ""
  },
  {
    "id": "3e5ec454.5ac53c",
    "type": "alexa-local",
    "z": "8f390e05.0dcbf",
    "devicename": "IO Key Data Transfer",
    "inputtrigger": true,
    "x": 249.07652282714844,
    "y": 346.61108112335205,
    "wires": [["a301cad5.02aee8"]]
  },
  {
    "id": "45c49674.b81d28",
    "type": "measurements",
    "z": "8f390e05.0dcbf",
    "name": "",
    "auth": "",
    "device": "device_io-key-357142090032045",
    "sensor": "887565",
    "channel": "357142090032045-AL002-1-1",
    "format": "mdsp",
    "datapoint": "1559295264254",
    "x": 234.07290649414062,
    "y": 457.30905532836914,
    "wires": [["dd6804c2.19fff8"]]
  },
  {
    "id": "580901cf.58c0a",
    "type": "mindconnect",
    "z": "8f390e05.0dcbf",
    "name": "",
    "configtype": "SHARED_SECRET",
    "agentconfig": "",
    "privatekey": "",
    "model": "",
    "validate": true,
    "validateevent": true,
    "chunk": false,
    "disablekeepalive": false,
    "retry": 3,
    "parallel": 1,
    "x": 816.0797348022461,
    "y": 453.76736068725586,
    "wires": [[]]
  },
  {
    "id": "a301cad5.02aee8",
    "type": "function",
    "z": "8f390e05.0dcbf",
    "name": "Data Transfer",
    "func": "if(msg.on === true||msg.payload.on === true){\n    flow.set('dataTransfer', true);\n  \n}else{\n    flow.set('dataTransfer', false);\n    \n}\n\nreturn msg;",
    "outputs": 1,
    "noerr": 0,
    "x": 524.069522857666,
    "y": 346.7604446411133,
    "wires": [[]],
    "icon": "node-red-contrib-alexa-local/alexa-local.png"
  },
  {
    "id": "dd6804c2.19fff8",
    "type": "function",
    "z": "8f390e05.0dcbf",
    "name": "Controll",
    "func": "let dataTransfer = flow.get('dataTransfer')||false;\n\nif(dataTransfer === true){\n    return msg\n}\n\n",
    "outputs": 1,
    "noerr": 0,
    "x": 504.0173149108887,
    "y": 456.0103750228882,
    "wires": [["580901cf.58c0a"]]
  },
  {
    "id": "84402137.8d624",
    "type": "comment",
    "z": "8f390e05.0dcbf",
    "name": "Flow Description",
    "info": "With this flow you can activate or deactivate\nthe data transfer to a cloud platform (here \nmindsphere) via alexa spoken command.",
    "x": 230.01734924316406,
    "y": 239.0104465484619,
    "wires": []
  }
]
```

## Development

## License

[MIT](http://vjpr.mit-license.org)
