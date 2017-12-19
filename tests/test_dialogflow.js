const _ = require('lodash');
const rewire = require('rewire');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

const EventEmitter = require('events');

class TestEmitter extends EventEmitter {
  end() {
    console.log('End called');
  }
}

process.env.APIAI_ACCESS_TOKEN = 'demo_access_token';
let dialogflow = rewire('../src/dialogflow');

const demoResponse = {
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

let botstackFakeInstance = {};
_.set(botstackFakeInstance, 'log.debug', () => {});

describe('Testing API.AI', () => {
  let revert = null;

  beforeEach(() => {
    revert = null;
  });

  afterEach(() => {
    if (revert) {
      revert();
      revert = null;
    }
  });

  it('Test processEvent using getApiAiResponse', async () => {
    revert = dialogflow.__set__('getDialogflowResponse', async () => demoResponse);
    let dialogflowInstance = dialogflow(botstackFakeInstance);
    const response = await dialogflowInstance.processEvent('demo', 'test_sender_id');
    assert.isOk(_.get(response, 'result.fulfillment.messages'));
  });

  it('Test processEvent with eventRequest', async () => {
    revert = dialogflow.__set__('getDialogflowInstance', () => ({
      eventRequest: () => {
        const testEmitter = new TestEmitter();
        setTimeout(() => {
          testEmitter.emit('response', demoResponse);
        }, 30);
        return testEmitter;
      }
    }));
    let dialogflowInstance = dialogflow(botstackFakeInstance);
    const response = await dialogflowInstance.processEvent('demo', 'test_sender_id');
    assert.isOk(_.get(response, 'messages'));
    assert.isTrue(_.get(_.find(response.messages, 'speech'), 'speech') === 'Hello ?');
  });

  it('Test processEvent with eventRequest error', async () => {
    const error = new Error('Ooops!');
    revert = dialogflow.__set__('getDialogflowInstance', () => ({
      eventRequest: () => {
        const testEmitter = new TestEmitter();
        setTimeout(() => {
          testEmitter.emit('error', error);
        }, 30);
        return testEmitter;
      }
    }));
    let dialogflowInstance = dialogflow(botstackFakeInstance);
    return assert.isRejected(dialogflowInstance.processEvent('demo', 'test_sender_id'), Error, 'Ooops!');
  });

  it('Test processTextMessage with eventRequest', async () => {
    revert = dialogflow.__set__('getDialogflowInstance', () => ({
      textRequest: () => {
        const testEmitter = new TestEmitter();
        setTimeout(() => {
          testEmitter.emit('response', demoResponse);
        }, 30);
        return testEmitter;
      }
    }));
    let dialogflowInstance = dialogflow(botstackFakeInstance);
    const response = await dialogflowInstance.processTextMessage('demo', 'test_sender_id');
    assert.isOk(_.get(response, 'messages'));
    assert.isTrue(_.get(_.find(response.messages, 'speech'), 'speech') === 'Hello ?');
  });

  it('Test processTextMessage with eventRequest error', async () => {
    const error = new Error('Ooops!');
    revert = dialogflow.__set__('getDialogflowInstance', () => ({
      textRequest: () => {
        const testEmitter = new TestEmitter();
        setTimeout(() => {
          testEmitter.emit('error', error);
        }, 30);
        return testEmitter;
      }
    }));
    let dialogflowInstance = dialogflow(botstackFakeInstance);
    return assert.isRejected(dialogflowInstance.processTextMessage('demo', 'test_sender_id'), Error, 'Ooops!');
  });
});
