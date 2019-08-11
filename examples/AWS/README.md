# node-red-contrib-io-key

## AWS Flow

With this flow sensor data can be directly published via MQTT to an AWS IOT Broker.


## Getting Started

### Step 1: Create a AWS Thing/Device
- Select the AWS *IoT Core* service
- Create your AWS Thing with a suitable policy
- Download all required certifications and keys

### Step 2: Configurate the MQTT node
- Select the *mqtt* node
- Add a new server
- Enter your server address and the following port: *8883*
- Check *Enable secure (SSL/TLS) connection*
- Add a new TLS configuration and upload the Certificate, Private Key, CA Certificate from you AWS IOT Broker
- After clicking on update the node should successfully connect with your broker
