const FACEBOOK_API_VERSION = '2.9';
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/v${FACEBOOK_API_VERSION}`;

function getFacebookGraphURL(endpoint) {
  return `${FACEBOOK_GRAPH_URL}${endpoint}`;
}

module.exports = {
  getFacebookGraphURL
};
