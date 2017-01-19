var AWS = require('./aws.js').AWS;
var request = require("request");
var fs = require('fs');

// var accessKeyId = process.env.AWS_ACCESS_KEY;
// var secretAccessKey = process.env.AWS_SECRET_KEY;
var bucketName = process.env.BUCKET_NAME;

// AWS.config.update({
//     accessKeyId: accessKeyId,
//     secretAccessKey: secretAccessKey
// });

function putFileInS3ByUrl(url, key, callback) {
    console.log('requesting image file');
    request({
        url: url,
        method: 'GET',
        encoding: null,
    }, function (err, response, body) {
        if (err) {
            console.log('Error in image get req', err);
        } else {
            console.log('sending to s3');
            putFileInS3(response.body, key, callback);
        }
    });
}

function putFileInS3(fileData, key, callback) {
    var s3bucket = new AWS.S3({ params: { Bucket: bucketName } });

    var params = {
        Key: key,
        Body: fileData,
        ContentType: 'application/octet-stream',
        ACL: 'public-read'
    };

    s3bucket.upload(params, callback);
}

function getUploadStream(key){
    var upload = request({
        method: 'PUT',
        url: 'https://' + bucketName + '.s3.amazonaws.com/' + key,
        aws: { bucket: bucketName, key: accessKeyId, secret: secretAccessKey }
    });

    return upload;
}

exports.putFileInS3ByUrl = putFileInS3ByUrl;
exports.putFileInS3 = putFileInS3;
exports.getUploadStream = getUploadStream;