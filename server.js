"use strict"

//imports
var restify = require("restify")
var request = require("request");

//user modules
var webhookGet = require('./src/webhook_get.js');
var webhookPost = require('./src/webhook_post.js');
var apiai_webhook = require('./src/api-ai-webhook.js');

var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser());

//root endpoint
server.get('/', function (req, res, next) {
	res.send('Nothing to see here...');
});

//facebook validation endpont
server.get("/webhook/", webhookGet);

//facebook message endpoint
server.post("/webhook/", webhookPost);

//api.ai generic storage hook
server.post("/apiaidb/", apiai_webhook);

var port = process.env.PORT || 1337;
server.listen(port, function () {
	console.log("listening on port:%s %s %s", port, server.name, server.url);
});

