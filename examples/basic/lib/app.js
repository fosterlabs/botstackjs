const BotStack = require('../../../index.js');

class DemoApp extends BotStack {};

const bot = new DemoApp("demo-app");
bot.startServer();
