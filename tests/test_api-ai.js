const lodash = require('lodash');
const rewire = require('rewire');
const assert = require('chai').assert;

const EventEmitter = require('events');

class TestEmitter extends EventEmitter {
    end() {
        console.log('End called');
    }
};

process.env.APIAI_ACCESS_TOKEN = 'demo_access_token';
const apiai = rewire('../src/api-ai');

const demoResponse =  {
    result: {
        fulfillment: {
            messages: [
                {
                    type: 0,
                    speech: 'Hello ?'
                }
            ]
        }
    }
};

describe('Testing API.AI', () => {

    it('Test processEvent', async function () {
        const revert = apiai.__set__('getApiAiResponse', async () => {
            return demoResponse;
        });

        const response = await apiai.processEvent('demo', 'test_sender_id');
        console.log(response);
        revert();
        assert.isTrue(true);
    });

    it('Test processEvent with eventRequest', async function () {
        const revert = apiai.__set__('apiAiService.eventRequest', () => {
            const testEmitter = new TestEmitter();
            setTimeout(() => {
                testEmitter.emit('response', demoResponse);
            }, 30);
            return testEmitter;
        });
        let response = await apiai.processEvent('demo', 'test_sender_id');
        revert();
        assert.isOk(lodash.get(response, 'messages'));
        assert.isTrue(lodash.get(lodash.find(response.messages, 'speech'), 'speech') === 'Hello ?');
    });
});
