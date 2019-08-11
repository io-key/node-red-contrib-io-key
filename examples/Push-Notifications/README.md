# node-red-contrib-io-key

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
