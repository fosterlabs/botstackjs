module.exports = () => {
    if (process.env.REDIS_URL) {
        return require('./sessions/redis.js');
    } else {
        return require('./sessions/mem.js');
    }
};
