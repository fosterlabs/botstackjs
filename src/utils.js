const URLRegex = require('url-regex');

function checkValidURL(urlDemo) {
  return URLRegex({ exact: true, strict: true }).test(urlDemo);
}

module.exports = {
  checkValidURL
};
