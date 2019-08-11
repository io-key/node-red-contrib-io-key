# node-red-contrib-io-key

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