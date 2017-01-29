const winston = require('winston');
const logger = new winston.Logger({
    transports: [
        new (winston.transports.Console)({
            timestamp: true,
            handleExceptions: true,
            json: false,
            level: process.env.LOG_LEVEL || "silly",
            prettyPrint: true,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
