"use strict"

//imports
const restify = require("restify")
const request = require("request");

//user modules
const webhookGet = require('./src/webhook_get.js');
const webhookPost = require('./src/webhook_post.js');
const apiai_webhook = require('./src/api-ai-webhook.js');

const server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser());

//root endpoint
server.get('/', (req, res, next) => {
	res.send('Nothing to see here...');
});

//facebook validation endpont
server.get("/webhook/", webhookGet);

//facebook message endpoint
server.post("/webhook/", webhookPost);

//api.ai generic storage hook
server.post("/apiaidb/", apiai_webhook);

const port = process.env.PORT || 1337;
server.listen(port, () => {
    console.log("listening on port:%s %s %s", port, server.name, server.url);
});

