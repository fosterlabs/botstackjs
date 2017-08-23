const BotStack = require('botstackjs');

class DemoApp extends BotStack {}

const bot = new DemoApp('demo-app');
bot.startServer();
