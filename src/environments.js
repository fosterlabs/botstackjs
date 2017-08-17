const lodash = require('lodash');
const restify = require('restify');

const envVars = [
  { name: 'FB_PAGE_ACCESS_TOKEN', required: true, module: ['fb'] },
  { name: 'FB_VERIFY_TOKEN', required: true, module: ['fb'] },
  { name: 'APIAI_ACCESS_TOKEN', required: true, module: ['api-ai'] },
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

function processEnvironmentVariables(self) {
  if (lodash.has(process.env, 'BOTSTACK_STATIC')) {
    if (!lodash.has(process.env, 'BOTSTACK_URL')) {
      throw new Error('BOTSTACK_URL not found');
    }
    self.server.get(/\/public\/?.*/, restify.serveStatic({
      directory: process.env.BOTSTACK_STATIC
    }));
  }
}

/* eslint-disable no-restricted-syntax */
function checkEnvironmentVariables() {
  let enabledModules = [];
  for (const envVar of envVars) {
    if (envVar.name in process.env) {
      enabledModules = lodash.union(enabledModules, envVar.module);
    }
  }
  const requiredModules = lodash.flatten(
    lodash.map(lodash.filter(envVars, data => data.required),
               data => data.module));
  enabledModules = lodash.union(enabledModules, requiredModules);

  let checkVars = [];
  for (const c of enabledModules) {
    const temp = lodash.map(
      lodash.filter(envVars, data => lodash.includes(data.module, c)),
      data => data.name);
    checkVars = lodash.union(checkVars, temp);
  }

  const notFoundEnvs = [];
  for (const e of checkVars) {
    if (!(e in process.env)) {
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
