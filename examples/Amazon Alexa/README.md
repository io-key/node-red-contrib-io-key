# node-red-contrib-io-key

## Amazon Alexa Example

With this flow you can activate or deactivate the data transfer to a cloud platform (here mindsphere) via alexa spoken command.
This is an small example how to interact with Alexa in your Node-RED flow. 
For deeper functions alexa skills are needed. You find more information to this topic [here](https://developer.amazon.com/de/alexa-skills-kit/?sc_category=paid&sc_channel=sem&sc_campaign=SEM-GO%7CNon-Brand%7CAll%7CREG%7CProfessional_Developer%7CEvergreen%7CIT%7CItalian%7CText%7Ccoding_language&sc_publisher=GO&sc_content=content&sc_detail=322783149505&sc_funnel=convert&sc_country=DE&sc_keyword=alexa%20skills%20entwickeln&sc_place=&sc_trackingcode=e&sc_segment=build_alexa_skill_e&sc_medium=paid%7Csem%7CSEM-GO%7CNon-Brand%7CAll%7CREG%7CProfessional_Developer%7CEvergreen%7CIT%7CItalian%7CText%7Ccoding_language%7CGO%7Ccontent%7C322783149505%7Cconvert%7CDE%7Calexa%20skills%20entwickeln%7C%7Ce%7Cbuild_alexa_skill_e)

## Getting Started

### Step 1: Download the Amazon Alexa app 
- Search for new devices
- Select the *IO Key Data Transfer* device

### Step 2: Install required modules
- Navigate to the manage palette in Node-RED and install the following modules
- *@mindconnect/node-red-contrib-mindconnect*
- *node-red-contrib-alexa-local*
- Copy you Agent Configuration into the mindconnect node

### Step 3: Test it
- Now you should be able to control alexa via your voice. For example: "Alexa turn IO Key Data Transfer on/off"