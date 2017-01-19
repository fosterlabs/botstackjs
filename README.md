# repost-bot

## API.AI Data Storage Hook
* Any `json` POSTed to this endpoint will be stored in the database, provided it includes a string property called `id`
* This endpoint is designed for logging webhook data from API.ai.
* Data sent to this endpoint is inserted into table `repost-apiai-logs` in AWS DynamoDB

```
POST https://repost-bot.herokuapp.com/apiaidb/
 
Headers:
    Content-type: application/json

Post Body:
{
    id: 'cc8ca971-0eec-4a04-ab54-d2af01e4674e',
    /* arbitrary json properties */ 
}

```

