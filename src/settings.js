const _ = require('lodash');
const fs = require('fs');
const path = require('path');


function checkAndLoadConfig() {
  let basePath = null;
  if (_.has(require.main, 'filename')) {
    basePath = path.dirname(require.main.filename);
  } else {
    basePath = process.cwd();
  }
  const configPath = path.join(basePath, 'conf/conf.json');
  if (fs.existsSync(configPath)) {
    return require(configPath); // eslint-disable-line global-require,import/no-dynamic-require
  }
  return {};
}

async function parseConfig(self) {
  const conf = checkAndLoadConfig();
  if (Object.keys(conf).length === 0) {
    self.log.debug('Started with default config (no configuration file found)', { module: 'botstack:constructor' });
  } else {
    self.log.debug('Custom config file loaded', { module: 'botstack:constructor' });
  }

  if (_.has(conf, 'subscribeTo')) {
    self.subscriber = require('./redis'); // eslint-disable-line global-require
    self.subscriber.on('message', (channel, message) => {
      self.subscription(message);
    });
    self.subscriber.subscribe(conf.subscribeTo);
    self.log.debug('Subscribed to Redis channel', {
      module: 'botstack:constructor',
      channel: conf.subscribeTo
    });
  }

  if (_.has(conf, 'getStartedButtonText')) {
    const data = await self.fb.getStartedButton(conf.getStartedButtonText);
    self.log.debug('Started button done', { module: 'botstack:constructor', result: data.result });
  } else {
    const data = await self.fb.getStartedButton();
    self.log.debug('Started button done', { module: 'botstack:constructor', result: data.result });
  }

  if (_.has(conf, 'persistentMenu')) {
    if ((_.isArray(conf.persistentMenu)) && (conf.persistentMenu.length > 0)) {
      if (_.has(conf.persistentMenu[0], 'type')) {
        // old style config
        const data = await self.fb.persistentMenu(conf.persistentMenu);
        self.log.debug('Persistent menu done', { module: 'botstack:constructor', result: data.result });
      } else if (_.has(conf.persistentMenu[0], 'call_to_actions')) {
        // new style config
        const data = await self.fb.setPersistentMenuViaProfile(conf.persistentMenu);
        self.log.debug('Persistent menu done', { module: 'botstack:constructor', result: data.result });
      }
    }
  }

  if (_.has(conf, 'welcomeText')) {
    const data = await self.fb.greetingText(conf.welcomeText);
    self.log.debug('Welcome text done', { module: 'botstack:constructor', result: data.result });
  }
}

module.exports = {
  checkAndLoadConfig,
  parseConfig
};
