# iokey Realtime Postman Description

- Import Postman collection
- Import Postman environment
- Enter tenantId in postman environment (Login to your autosen.cloud tenant and click on you user icon on the upper right-hand side to find your unique tenant id)
- Enter username and password
- Enter your data type (measurements or alarms)
- Enter your sensor id (Open your autosen.cloud cockpit and select your sensor, you can find the sensorId inside the url "https://yourteant.autosen.cloud/apps/cockpit/index.html#/device/137828852/details" -> 137828852)
- Execute "Handshake Session" (Make sure you environment is selected) and copy the clientId into your environment
- Execute "Subscribe Channel" to subscribe your data
- Execute "Connect"
- The request now waits until the realtime api receives new sensor data (The request will also timeout after x seconds, if no data is received in that time, you have to connect again)
