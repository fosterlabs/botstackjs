module.exports = () => {
  if (process.env.REDIS_URL) {
    throw new Error('Not implemented');
  } else {
    return require('./mem');
  }
};
