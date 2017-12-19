module.exports = function init(botstackInstance) {
  // console.log(init.caller);
  if (process.env.REDIS_URL) {
    throw new Error('Not implemented');
  } else {
    return require('./mem')(botstackInstance);
  }
};
