let AWS = require('./aws.js').AWS;
const request = require("request");
const fs = require('fs');

// var accessKeyId = process.env.AWS_ACCESS_KEY;
// var secretAccessKey = process.env.AWS_SECRET_KEY;
let bucketName = process.env.BUCKET_NAME;

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
    }, (err, response, body) => {
        if (err) {
            console.log('Error in image get req', err);
        } else {
            console.log('sending to s3');
            putFileInS3(response.body, key, callback);
        }
    });
}

function putFileInS3ByUrlAsync(url, key) {
    return new Promise((resolve, reject) => {
        console.log('requesting image file');
        request({
            url: url,
            method: 'GET',
            encoding: null,
        }, (err, response, body) => {
            if (err) {
                console.log('Error in image get req', err);
                reject(err);
            } else {
                if (response.headers['content-type'] == "image/png") {
                    key = key + ".png";
                };
                if (response.headers['content-type'] == "image/jpeg") {
                    key = key + ".jpg";
                };
                console.log('sending to s3');
                putFileInS3(response.body, key, response.headers['content-type'], (error, data) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data);
                    }
                });
            }
        });
    })
}

function putFileInS3(fileData, key, contentType, callback) {
    let s3bucket = new AWS.S3({ params: { Bucket: bucketName } });

    let params = {
        Key: key,
        Body: fileData,
        ContentType: contentType || 'application/octet-stream',
        ACL: 'public-read'
    };

    s3bucket.upload(params, callback);
}

function putFileInS3Async(fileData, key) {
    return new Promise((resolve, reject) => {
        let s3bucket = new AWS.S3({ params: { Bucket: bucketName } });
        let params = {
            Key: key,
            Body: fileData,
            ContentType: 'application/octet-stream',
            ACL: 'public-read'
        };
        s3bucket.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
    })
}

function getUploadStream(key){
    let upload = request({
        method: 'PUT',
        url: 'https://' + bucketName + '.s3.amazonaws.com/' + key,
        aws: { bucket: bucketName, key: accessKeyId, secret: secretAccessKey }
    });

    return upload;
}

exports.putFileInS3ByUrl = putFileInS3ByUrl;
exports.putFileInS3ByUrlAsync = putFileInS3ByUrlAsync;
exports.putFileInS3 = putFileInS3;
exports.putFileInS3Async = putFileInS3Async;
exports.getUploadStream = getUploadStream;
