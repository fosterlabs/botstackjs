const db = require('./dynamodb.js');

module.exports = (req, res, next) => {

	res.json({
		speech: req.body.result.fulfillment.speech,
		displayText: req.body.result.fulfillment.speech,
		source: 'repost-bot'
	});

	res.end();
	console.log("===Received a database hook from API.ai");

    //add to db
    if(req.body) {
        db.logApiaiObject(req.body);
    } else {
        console.log('No body to put in DB');
    }

	return next();
};
