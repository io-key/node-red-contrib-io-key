# node-red-contrib-io-key

## Microsoft Azure Communication

This flow establishes a connection to the azure cloud via mqtt.

## Getting Started

### Step 1: Set up Azure
- Create a new device on your Azure IoT Hub
- Generate your device's SAS token
- Enter your device credentials in the mqtt node:
 	* Create a server configuration: 
 	* In the connection tab add the following values
 		* Server: `{your iothubhostname}`
 		* TLS: Activate checkbox
 		* Client-ID: `{your device_id}`
 	* In the security tab add the following values
    	* Username: `{your iothubhostname}/{your device_id}/?api-version=2018-06-30`
    	* Password: `{SAS}`
    * Back the main tab of the mqtt node enter your topic: 
    	* Topic: `devices/{your devicename}/messages/events/`

### Step 2: Test it

- Now you have successfully set up your Azure Communication
