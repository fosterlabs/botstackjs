const BotStack = require('../../../index.js');

class DemoApp extends BotStack {};

const bot = new SatBot("demo-app");
bot.startServer();
