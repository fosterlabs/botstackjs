const _ = require('lodash');
const multimap = require('../common/multimap');
const settings = require('../settings');

module.exports = (botstackInstance) => {
  const self = botstackInstance;

  /**
   * Get config env value using settings data
   */
  function getConfigEnv(envName) {
    const config = settings.checkAndLoadConfig();
    return _.get(config, `env.${envName}`, null);
  }

  /**
   * Set env value into multimap (inmemory hash)
   */
  function setEnv(envName, envValue = {}) {
    delEnv(envName);
    multimap.set(envName, envValue);
  }

  /**
   * Drop all values from multimap
   */
  function reload() {
    multimap.dropAll();
  }

  /**
   * Get env value by envName from multimap (inmemory hash)
   */
  async function getEnv(envName, params = {}) {
    if ((self) && (self.customGetEnv) && (_.has(params, 'pageId'))) {
      let value = await self.customGetEnv(envName, params);
      if (value) {
        return value;
      }
    }
    let value = multimap.get(envName);
    if (!value) {
      if (self && self.customGetEnv) {
        value = _.get(process.env, envName, null) || getConfigEnv(envName) || await self.customGetEnv(envName, params);
      } else {
        value = _.get(process.env, envName, null) || getConfigEnv(envName);
      }
      // how to search with additional params ? not with envName only ?
      /*
      if (value) {
        setEnv(envName, value);
      }
      */
    }
    return value;
  }

  function delEnv(envName) {
    multimap.del(envName);
  }

  async function getEnvDefault(envName) {
    const envVal = await getEnv(envName);
    if (_.isArray(envVal)) {
      const searchResult = _.find(envVal, obj => _.get(obj, 'is_default') === 'true');
      return _.get(searchResult, envName);
    }
    return envVal;
  }

  async function getFacebookPageTokenByPageID(pageId) {
    const envVal = await getEnv('FB_PAGE_ACCESS_TOKEN', { pageId });
    if (_.isArray(envVal)) {
      let searchResult = null;
      if (pageId) {
        searchResult = _.find(envVal, obj => _.get(obj, 'PAGE_ID') === pageId);
      }
      let result = _.get(searchResult, 'FB_PAGE_ACCESS_TOKEN', null);
      if (!result) {
        result = await getEnvDefault('FB_PAGE_ACCESS_TOKEN');
      }
      return result;
    }
    return envVal;
  }

  return {
    getEnv,
    setEnv,
    getEnvDefault,
    getFacebookPageTokenByPageID,
    reload
  };
};
