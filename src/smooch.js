const lodash = require('lodash');
const SmoochCore = require('smooch-core');

const log = require('./log');

const smooch = new SmoochCore({
    keyId: process.env.SMOOCH_KEY_ID || '',
    secret: process.env.SMOOCH_SECRET || '',
    scope: process.env.SMOOCH_SCOPE || 'app'
});

async function processWebhook(body = {}) {
    const appUserId = lodash.get(body, 'appUser._id');
    if (lodash.get(body, 'trigger') === 'message:appUser') {
        log.debug('New message from Smooch', {
            module: 'botstack:smooch',
            body
        });
        for (const msg of lodash.get(body, 'messages')) {
            if (lodash.get(msg, 'source.type') === 'api') {
                continue;
            }
            const authorId = lodash.get(msg, 'authorId');
            // const result = await smooch.appUsers.sendMessage(authorId, {});
        }
    }
}

async function sendMessage(text, authorID) {
    const result = await smooch.appUsers.sendMessage(authorID, {
        type: 'text',
        text,
        role: 'appMaker'
    });
}

module.exports = {
    processWebhook,
    sendMessage
};
