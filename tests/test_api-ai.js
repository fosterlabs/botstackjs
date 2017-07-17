require('dotenv').config();
const rewiremock = require('rewiremock').default;
const assert = require('chai').assert;

const EventEmitter = require('events').EventEmitter;

class EventRequest extends EventEmitter {}

function eventRequest(event, options) {
    const eventRequestEmitter = new EventRequest();
    setTimeout(() => {
        eventRequestEmitter.emit('response', {
            result: {
                fulfillment: {
                    messages: []
                }
            }
        });
    }, 300);
}

rewiremock('apiai').with({ eventRequest });

describe('Testing API.AI', () => {
    beforeEach( () => rewiremock.enable() );
    it('Test 1', async function () {
        // process.env.APIAI_ACCESS_TOKEN = 'demo';
        const api_ai = require('../src/api-ai');
        let ddd = await api_ai.processEvent('demo', 'test_sender_id');
        console.log(ddd);
        assert.isTrue(true);
    });
    afterEach( () => rewiremock.disable() );
});
