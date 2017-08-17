const rp = require('request-promise');
const lodash = require('lodash');
const log = require('../log');

async function setMessengerProfileData(data) {
  const reqData = {
    url: 'https://graph.facebook.com/v2.10/me/messenger_profile',
    qs: {
      access_token: process.env.FB_PAGE_ACCESS_TOKEN
    },
    resolveWithFullResponse:  true,
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
};

async function setPersistentMenuViaProfile(data = []) {
  log.debug('Sending persistent menu', {
    module: 'botstack:fb'
  });
  const data = {
    persistent_menu: lodash.deepClone(data)
  };
  return setMessengerProfileData(data);
}

module.exports = {
  setPersistentMenuViaProfile
};
