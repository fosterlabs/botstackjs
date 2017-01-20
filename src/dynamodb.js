let AWS = require('./aws.js').AWS;
const apiAiTable = process.env.DB_API_AI_LOG_TABLE || 'repost-apiai-logs';
const logTable = process.env.DB_LOG_TABLE || 'repost-logs';

function logInteraction(senderId, message, type) {
    let docClient = new AWS.DynamoDB.DocumentClient();
    let ts = new Date().getTime();

    let params = {
        TableName: logTable,
        Item: {
            utc_timestamp: ts,
            senderId : senderId,
            message: message,
            type: type
        }
    };

    docClient.put(params, (err, data) => {
        if (err) {
            console.log('Error logInteraction DynamoDB PUT', err);
        } else {
            console.log('logInteraction DynamoDB PUT Succeeded');
        };
    });
};

//dumps any incoming JSON object into the table repost-arb
function logApiaiObject(arbitraryObj) {
    //ensure all string have values
    assignEmptyStrings(arbitraryObj);


    let docClient = new AWS.DynamoDB.DocumentClient();
    let params = {
        TableName: apiAiTable,
        Item: arbitraryObj
    }

    docClient.put(params, (err, data) => {
        if (err) {
            console.log('Error logApiaiObject DynamoDB PUT', err);
        } else {
            console.log('logApiaiObject DynamoDB PUT Succeeded');
        };
    });
}

//recursive function to ensure that all strings have some value
function assignEmptyStrings(object) {
    for(let prop in object) {
        if(!object.hasOwnProperty(prop)) {               //check it is not a built-in type
            continue;
        }

        if(typeof object[prop] === 'object') {
            assignEmptyStrings(object[prop]);               //recursion if this prop is an object type

        } else if(object[prop] === '') {
            object[prop] = '**EMPTY**';
        }
    }
}

exports.logInteraction = logInteraction;
exports.logApiaiObject = logApiaiObject;
