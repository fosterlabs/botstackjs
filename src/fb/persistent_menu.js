const _ = require('lodash');
const rp = require('request-promise');
const log = require('../log');
const multiconf = require('../multiconf');
const constants = require('../common/constants');

module.exports = (botstackInstance) => {
  const self = botstackInstance;
  const env = multiconf(self);

  async function setMessengerProfileData(data, pageId = null) {
    const FB_PAGE_ACCESS_TOKEN = await env.getFacebookPageTokenByPageID(pageId);
    const reqData = {
      url: constants.getFacebookGraphURL('/me/messenger_profile'),
      qs: {
        access_token: FB_PAGE_ACCESS_TOKEN
      },
      resolveWithFullResponse: true,
      method: 'POST',
      json: data
    };

    try {
      const response = await rp(reqData);
      if (response.statusCode == 200) {
        log.debug('Sent persistent menu', {
          module: 'botstack:fb'
        });
        return response.body;
      }
      log.error('Error in Facebook response', {
        module: 'botstack:fb', response: response.body
      });
      throw new Error(`Error in Facebook response ${response.body}`);
    } catch (e) {
      log.error(e, {
        module: 'botstack:fb'
      });
      throw e;
    }
  }

  async function setPersistentMenuViaProfile(initData = [], pageId = null) {
    log.debug('Sending persistent menu', {
      module: 'botstack:fb'
    });
    const data = {
      persistent_menu: _.cloneDeep(initData)
    };
    return setMessengerProfileData(data, pageId);
  }

  return {
    setPersistentMenuViaProfile
  };
};
