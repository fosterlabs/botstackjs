var AWS = require('aws-sdk');
var accessKeyId = process.env.AWS_ACCESS_KEY;
var secretAccessKey = process.env.AWS_SECRET_KEY;

AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey, 
    region: "us-east-1"
});

exports.AWS = AWS;