# BotStackjs

## Why?
We believe the beginning of a successful bot has little to do with engineering and everything to do with the skill of the product owner in acquiring users and keeping them faster than their competition.

That's why we've open sourced our Facebook Messenger node.js code base so you can get all the latest features from API.AI, Facebook Messenger and Analytics like Dashbot and BotMetrics. While setting yourself up for success with a robust and extensible code base when you've tested your assumptions and are ready for an engineer to build domain specific features.


## The Stack
* BotStackjs - clean modular resumable libraries 
* Node.js (Highly scalable, ultra fast code)
* API.AI (Google owned NLP. Super easy to configure and train)
* DashBot and BotMetrics (Analytics and Broadcast features)
* Amazon Dynamodb (Logging)

## Features
* Configurable 'Get Started Greeting'
* Configurable  Messenger Action Menu in code
* Configurable User Onboarding Messages
* API.AI Content Support (Image, Quick Replys, Card, Custom Payload)
* Integrated analytics for DashBot & BotMetrics

## Roadmap
* What would you like to add or improve?


## Installation
* git clone https://github.com/cama/botstackjs.git
* set API keys in env_tmpl



## API.AI Data Storage Hook
* Any `json` POSTed to this endpoint will be stored in the database, provided it includes a string property called `id`
* This endpoint is designed for logging webhook data from API.ai.
* Data sent to this endpoint is inserted into table `botstackjs-apiai-logs` in AWS DynamoDB

```
POST https://botStackjs.herokuapp.com/apiaidb/
 
Headers:
    Content-type: application/json

Post Body:
{
    id: 'cc8ca971-0eec-4a04-ab54-d2af01e4674e',
    /* arbitrary json properties */ 
}

```

## How to get involved?
It's still early days and everything we are learning on customers messenger bots we are trying to incorporate here. 

If you are using this source code and make enhancements please feed the changes back in. If you are more a product person message me or add your ideas under the issues.
