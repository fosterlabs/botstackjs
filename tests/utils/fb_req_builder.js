const _ = require('lodash');

function buildFbRequest({page_id='1', messaging=[]}={}) {
  let req = {};
  const entry = {
    id: page_id
  };
  _.set(entry, 'messaging', messaging);
  _.set(req, 'body.entry', [ entry ]);
  _.set(req, 'body.object', 'page');
  return req;
}

function buildFbResponse() {
  let res = {};
  _.set(res, 'end', () => {});
  return res;
}

module.exports = {
  buildFbRequest,
  buildFbResponse
};
