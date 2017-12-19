const _ = require('lodash');
const restify = require('restify');
const multiconf = require('./multiconf');

const envVars = [
  { name: 'FB_PAGE_ACCESS_TOKEN', required: true, module: ['fb'] },
  { name: 'FB_VERIFY_TOKEN', required: true, module: ['fb'] },
  { name: 'DIALOGFLOW_ACCESS_TOKEN', required: true, module: ['dialogflow'] },
  { name: 'AWS_ACCESS_KEY', required: false, module: ['s3'] },
  { name: 'AWS_SECRET_KEY', required: false, module: ['s3'] },
  { name: 'BUCKET_NAME', required: false, module: ['s3'] },
  { name: 'BOTLYTICS_API_KEY', required: false, module: ['botlyptics'] },
  { name: 'BOTMETRICS_TOKEN', required: false, module: ['botmetrics'] },
  { name: 'DASHBOT_API_KEY', required: false, module: ['dashbot'] },
  { name: 'MONGODB_URI', required: false, module: ['db'] },
  { name: 'REDIS_URL', required: false, module: ['session'] },
  { name: 'SMOOCH_KEY_ID', required: false, module: ['smooch'] },
  { name: 'SMOOCH_SECRET', required: false, module: ['smooch'] },
  { name: 'SMOOCH_SCOPE', required: false, module: ['smooch'] }
];

async function processEnvironmentVariables(self) {
  const env = multiconf(self);
  const BOTSTACK_STATIC = await env.getEnv('BOTSTACK_STATIC');
  const BOTSTACK_URL = await env.getEnv('BOTSTACK_URL');
  if (BOTSTACK_STATIC) {
    if (BOTSTACK_URL) {
      throw new Error('BOTSTACK_URL not found');
    }
    self.server.get(/\/public\/?.*/, restify.serveStatic({
      directory: BOTSTACK_STATIC
    }));
  }
}

/* eslint-disable no-restricted-syntax */
async function checkEnvironmentVariables(self) {

  const env = multiconf(self);
  let enabledModules = []; // list of enabled modules (found values in env)

  let _getEnvPromises = [];
  for (const envVar of envVars) {
    _getEnvPromises.push(env.getEnv(envVar.name));
  }
  const _getEnvPromisesResults = await Promise.all(_getEnvPromises);

  let _envVarsValues = []; // values of all possible env vars
  let idx = 0;
  for (const env of envVars) {
    _envVarsValues.push({
      name: env.name,
      value: _getEnvPromisesResults[idx],
      module: env.module
    });
    idx += 1;
  }

  // filtered env var values (check value exists)
  const _envVarsValuesActive = _.filter(_envVarsValues, (x) => { return x.value; });
  // list of modules names, which env values exists in env
  enabledModules = _.uniq(_.flattenDeep(_.map(_envVarsValuesActive, (e) => e.module)));
  // list of required modules
  const requiredModules = _.flatten(
    _.map(_.filter(envVars, data => data.required),
          data => data.module));
  // union required modules with enabled modules for checking all rules
  // for example:
  // fb module required: FB_PAGE_ACCESS_TOKEN and FB_VERIFY_TOKEN
  // if we have in env only FB_PAGE_ACCESS_TOKEN, BotstackJS understand as we turn on FB module
  // and next BotstackJS should check all envs for this module: FB_PAGE_ACCESS_TOKEN, FB_VERIFY_TOKEN
  enabledModules = _.union(enabledModules, requiredModules);
  let checkVars = [];
  for (const c of enabledModules) {
    const temp = _.map(
      _.filter(envVars, data => _.includes(data.module, c)),
      data => data.name);
    checkVars = _.union(checkVars, temp);
  }

  const notFoundEnvs = [];
  for (const e of checkVars) {
    if (!await env.getEnv(e)) {
      notFoundEnvs.push(e);
    }
  }

  if (notFoundEnvs.length > 0) {
    throw new Error(`Not found env variables: ${notFoundEnvs.join(',')}`);
  }
}
/* eslint-enable no-restricted-syntax */

module.exports = {
  checkEnvironmentVariables,
  processEnvironmentVariables
};
