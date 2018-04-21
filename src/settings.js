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

  let pageIds = [];
  if ('getPageAccessTokensCollection' in self) {
    pageIds = await self.getPageAccessTokensCollection();
    self.log.debug('Using multitoken FB setup!');
  } else {
    self.log.debug('Using single token FB setup!');
  }

  if (_.has(conf, 'getStartedButtonText')) {
    let data = null;
    let result = null;
    if (pageIds.length > 0) {
      data = [];
      for (const pageId of pageIds) {
        data.push(await self.fb.getStartedButton(conf.getStartedButtonText, pageId));
      }
      result = _.map(data, (c) => _.get(c, 'result'));
    } else {
      data = await self.fb.getStartedButton(conf.getStartedButtonText);
      result = _.get(data, 'result');
    }
    self.log.debug('Started button done', { module: 'botstack:constructor', result: result });
  } else {
    const data = await self.fb.getStartedButton();
    self.log.debug('Started button done', { module: 'botstack:constructor', result: data.result });
  }

  if (_.has(conf, 'persistentMenu')) {
    let data = null;
    let result = null;
    if ((_.isArray(conf.persistentMenu)) && (conf.persistentMenu.length > 0)) {
      if (_.every(conf.persistentMenu, 'type')) {
        // old style config
        if (pageIds.length > 0) {
          data = [];
          for (const pageId of pageIds) {
            data.push(await self.fb.persistentMenu(conf.persistentMenu, pageId));
          }
          result = _.map(data, (c) => _.get(c, 'result'));
        } else {
          data = await self.fb.persistentMenu(conf.persistentMenu);
          result = _.get(data, 'result');
        }
        self.log.debug('Persistent menu done', { module: 'botstack:constructor', result: result });
      } else if (_.some(conf.persistentMenu, 'call_to_actions')) {
        // new style config
        if (pageIds.length > 0) {
          data = [];
          for (const pageId of pageIds) {
            data.push(await self.fb.setPersistentMenuViaProfile(conf.persistentMenu, pageId));
          }
          result = _.map(data, (c) => _.get(c, 'result'));
        } else {
          data = await self.fb.setPersistentMenuViaProfile(conf.persistentMenu);
          result = _.get(data, 'result');
        }
        self.log.debug('Persistent menu done', { module: 'botstack:constructor', result: result });
      }
    }
  }

  if (_.has(conf, 'welcomeText')) {
    let data = null;
    let result = null;
    if (pageIds.length > 0) {
      data = [];
      for (const pageId of pageIds) {
        data.push(await self.fb.greetingText(conf.welcomeText));
      }
      result = _.map(data, (c) => _.get(c, 'result'));
    } else {
      data = await self.fb.greetingText(conf.welcomeText);
      result = _.get(data, 'result');
    }
    self.log.debug('Welcome text done', { module: 'botstack:constructor', result: result });
  }
}

module.exports = {
  checkAndLoadConfig,
  parseConfig
};
