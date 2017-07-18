const rewiremock = require('rewiremock').default;
const rewire = require('rewire');
const sinon = require('sinon');
const assert = require('chai').assert;

process.env.APIAI_ACCESS_TOKEN = 'demo_access_token';
const apiai = rewire('../src/api-ai');

describe('Testing API.AI', () => {
    // beforeEach( () => rewiremock.enable() );
    it('Test processEvent', async function () {
        const revert = apiai.__set__('getApiAiResponse', async () => {
            return {
                result: {
                    fulfillment: {
                        messages: []
                    }
                }
            };
        });

        let ddd = await apiai.processEvent('demo', 'test_sender_id');
        console.log(ddd);
        revert();
        assert.isTrue(true);
    });
    // afterEach( () => rewiremock.disable() );
});
