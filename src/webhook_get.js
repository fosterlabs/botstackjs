//The endpoint for facebook to verify the bot

module.exports = (req, res, next) => {
    let token = req.query.hub.verify_token;
    if (token === process.env.FB_VERIFY_TOKEN) {
        res.write(req.query.hub.challenge);
        res.end();
    } else {
        res.send("Error, wrong validation token");
    }

    return next();
};
