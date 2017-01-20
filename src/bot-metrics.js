const BOTMETRICS_TOKEN = process.env.BOTMETRICS_TOKEN;

const BotMetrics = require('node-botmetrics');
let botmetrics = new BotMetrics(BOTMETRICS_TOKEN);

function logUserRequest(message, conversationId) {
	log(message, conversationId, conversationId, 'incoming');
};

function logServerResponse(message, conversationId) {
	log(message, conversationId, conversationId, 'outgoing');
};

function log(message, conversationId, userId, type) {
	botmetrics.track({
		text: message,
		message_type: type,
		user_id: userId,
		conversation_id: conversationId,
		platform: 'messenger'
	});
};

exports.logUserRequest = logUserRequest;
exports.logServerResponse = logServerResponse;
