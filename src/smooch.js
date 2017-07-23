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

async function sendCommonMessage(authorID, message = {}) {
    let commonMessage = {
        role: 'appMaker'
    };
    lodash.merge(commonMessage, message);
    const result = await smooch.appUsers.sendMessage(authorID, commonMessage);
    return result;
}

async function getAppsList() {
    const smooch2 = new SmoochCore({
        keyId: process.env.SMOOCH_KEY_ID || '',
        secret: process.env.SMOOCH_SECRET || '',
        scope: process.env.SMOOCH_SCOPE || 'account'
    });
    const result = await smooch2.apps.list();
    return result;
}

async function getIntegrations(appId) {
    const smooch2 = new SmoochCore({
        keyId: 'act_5974b9096a784df4009ba18c',
        secret: 'h-uUZHW-u13SgqH9DmdVWdZA',
        scope: 'account'
    });
    const result = await smooch2.integrations.list(appId);
    // const result = await smooch2.apps.list();
    return result;
}

function textMessage(message) {
    return {
        type: 'text',
        text: message
    };
}

function imageReply(message) {
    return {
        type: 'image',
        text: '',
        mediaUrl: message.imageUrl || message.url
    };
}

async function processMessagesFromApiAi(apiAiResponse, senderID) {
    for (const message of apiAiResponse.messages) {
        let replyMessage = null;
        log.debug('Process message from API.AI', {
            module: 'botstack:smooch',
            message,
            messageType: message.type
        });
        switch(message.type) {
        case 0: // text message
            replyMessage = textMessage(message.speech);
            break;
        case 3: // image response
            replyMessage = imageReply(message);
            break;
        }
        const result = await sendCommonMessage(senderID, replyMessage);
    }
}

module.exports = {
    processWebhook,
    sendMessage,
    getAppsList,
    getIntegrations,
    processMessagesFromApiAi
};
