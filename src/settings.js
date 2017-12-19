const fs = require('fs');
const path = require('path');
const lodash = require('lodash');

function checkAndLoadConfig() {
  let basePath = null;
  if (lodash.has(require.main, 'filename')) {
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

  if (lodash.has(conf, 'subscribeTo')) {
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

  if (lodash.has(conf, 'getStartedButtonText')) {
    self.fb.getStartedButton(conf.getStartedButtonText).then((data) => {
      self.log.debug('Started button done', { module: 'botstack:constructor', result: data.result });
    });
  } else {
    self.fb.getStartedButton().then((data) => {
      self.log.debug('Started button done', { module: 'botstack:constructor', result: data.result });
    });
  }

  if (lodash.has(conf, 'persistentMenu')) {
    if ((lodash.isArray(conf.persistentMenu)) && (conf.persistentMenu.length > 0)) {
      if (lodash.has(conf.persistentMenu[0], 'type')) {
        // old style config
        self.fb.persistentMenu(conf.persistentMenu).then((data) => {
          self.log.debug('Persistent menu done', { module: 'botstack:constructor', result: data.result });
        });
      } else if (lodash.has(conf.persistentMenu[0], 'call_to_actions')) {
        // new style config
        self.fb.setPersistentMenuViaProfile(conf.persistentMenu).then((data) => {
          self.log.debug('Persistent menu done', { module: 'botstack:constructor', result: data.result });
        });
      }
    }
  }

  if (lodash.has(conf, 'welcomeText')) {
    self.fb.greetingText(conf.welcomeText).then((data) => {
      self.log.debug('Welcome text done', { module: 'botstack:constructor', result: data.result });
    });
  }
}

module.exports = {
  checkAndLoadConfig,
  parseConfig
};
