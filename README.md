## BotStackjs

[![Build Status](https://travis-ci.org/cama/botstackjs.svg?branch=master)](https://travis-ci.org/cama/botstackjs)
[![npm version](https://badge.fury.io/js/botstack.svg)](https://badge.fury.io/js/botstack)
[![npm](https://img.shields.io/npm/dm/botstack.svg)]()

## Why?
We believe the beginning of a successful bot has little to do with engineering and everything to do with the skill of the product owner in acquiring users and keeping them faster than their competition.

That's why we've open sourced our Facebook Messenger node.js code base so you can get all the latest features from API.AI, Facebook Messenger and Analytics like Dashbot and BotMetrics. While setting yourself up for success with a robust and extensible code base when you've tested your assumptions and are ready for an engineer to build domain specific features.

## Installation
* `npm install botstack`
* set API keys in env_tmpl

## Example
Create `index.js` file with this content:

```js
const BotStack = require('botstack');

class ExampleBot extends BotStack {};

const bot = new ExampleBot('example-bot');
bot.startServer();
```
Before the start of the bot, we need to set a few environment variables:
```bash
FB_PAGE_ACCESS_TOKEN, FB_VERIFY_TOKEN, APIAI_ACCESS_TOKEN
```
If you don't want to set environment variables explicitly, you can use the `dotenv` library.

Example:

1. Create `.env` file in the root folder of your project
Example:
```bash
FB_PAGE_ACCESS_TOKEN=
FB_VERIFY_TOKEN=
APIAI_ACCESS_TOKEN=
```
2. Create JS file:
```js
require('dotenv').config();
class ExampleBot extends BotStack {};

const bot = new ExampleBot('example-bot');
bot.startServer();
```

3. Run
```bash
node index.js
```
Other examples you can find in the `examples` folder of this repository.

## Features
* Emjoi Support 
* Configurable 'Greeting, Get Started Button & Action Menu'
* Simple User Onboarding Design
* Facebook Referral Support- Track different links placed in different channels to see which is most effective
* NLP - Inuitive and easy use Natural Langage Programming
* Easily setup FB structured messages (Image, Quick Replys, Card, Custom Payload)
* Analytics and Insights
* Subscription and Broadcast capabilities with Backchat.io

## Stack
* BotStackjs - clean modular re-usable libraries 
* Node.js - Scalable fast code
* API.AI - Best in class Natural Language Processing
* Redis [Optional] - In-memory cache storage for thing like user sessions
* Docker - Management and simplified deployment of services


## Code
* Better Promise Support with Bluebird and request-promise
* Good Test Coverage
* Structured logging with Winston - specify additional metadata (like session id, user id, module name, etc)
* Track Stack Traces with Sentry

## Roadmap
* Facebook Webviews
* Rabbit MQ Support

## How to get involved?
It's still early days and everything we are learning on customers messenger bots we are trying to incorporate here. 
If you are using this source code and make enhancements please feed the changes back in. If you are more a product person message me or add your ideas under the issues.
