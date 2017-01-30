## BotStackjs

### IMPORTANT: We are currently re-factoring and moving code from our active bots and trying work out the best method to package up the 3rd party services (i.e. RDIS, Sentry, RDIS, Mongo DB) with out blowing out costs. Some features and functionality may not be available. Message if there is something particular you are after.

## Why?
We believe the beginning of a successful bot has little to do with engineering and everything to do with the skill of the product owner in acquiring users and keeping them faster than their competition.

That's why we've open sourced our Facebook Messenger node.js code base so you can get all the latest features from API.AI, Facebook Messenger and Analytics like Dashbot and BotMetrics. While setting yourself up for success with a robust and extensible code base when you've tested your assumptions and are ready for an engineer to build domain specific features.

## Features
* Configurable 'Get Started Greeting'
* Configurable Messenger Action Menu
* Configurable User Onboarding Messages
* M.Me referals - Track different links placed in different channels to see which is most effective
* API.AI Content Support (Image, Quick Replys, Card, Custom Payload)
* Integrated analytics for DashBot & BotMetrics

## Stack
* BotStackjs - clean modular re-usable libraries 
* Node.js - Scalable fast code
* API.AI - Best in class Natural Language Processing
* DashBot & BotMetrics - Insightful analytics and powerful broadcast
* Mongo DB - Open-source database to user settings
* Redis - In-memory cache storage for thing like user sessions

## Code
* Subscriber service with Cron
* Better Promise Support with Bluebird and request-promise
* Solid Test Coverage
* Structured logging with Winston - specify additional metadata (like session id, user id, module name, etc)
* Track Stack Traces with Sentry

## Roadmap
* Rabbit MQ Support

## Installation
* git clone https://github.com/cama/botstackjs.git
* set API keys in env_tmpl

## How to get involved?
It's still early days and everything we are learning on customers messenger bots we are trying to incorporate here. 
If you are using this source code and make enhancements please feed the changes back in. If you are more a product person message me or add your ideas under the issues.
