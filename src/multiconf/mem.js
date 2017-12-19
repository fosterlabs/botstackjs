const _ = require('lodash');
const multimap = require('../common/multimap');
const settings = require('../settings');

function getConfigEnv(envName) {
  const config = settings.checkAndLoadConfig();
  return _.get(config, `env.${envName}`);
}

function getEnv(envName) {
  return getConfigEnv(envName) || _.get(process.env, envName, null);
}

function getEnvDefault(envName) {
  const envVal = getEnv(envName);
  if (_.isArray(envVal)) {
    const searchResult = _.find(envVal, (obj) => { return _.get(obj, 'is_default') === 'true'; });
    return _.get(searchResult, envName);
  } else {
    return envVal;
  }
}

function getFacebookPageTokenByPageID(pageID) {
  const envVal = getEnv('FB_PAGE_ACCESS_TOKEN');
  if (_.isArray(envVal)) {
    let searchResult = null;
    if (pageID) {
      searchResult = _.find(envVal, (obj) => { return _.get(obj, 'PAGE_ID') === pageID; });
    }
    let result = _.get(searchResult, 'FB_PAGE_ACCESS_TOKEN', null);
    if (!result) {
      result = getEnvDefault('FB_PAGE_ACCESS_TOKEN');
    }
    return result;
  } else {
    return envVal;
  }
}

module.exports = {
  getEnv,
  getEnvDefault,
  getFacebookPageTokenByPageID
};
