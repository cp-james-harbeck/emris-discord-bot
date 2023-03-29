const { HandCashConnect } = require('@handcash/handcash-connect');
const { setUserAuthToken } = require('./redisHandler');

const config = require('../../config/handcash');

class HandCashAuth {
    constructor(redisHandler, redisClient) {
        this.redisHandler = redisHandler;
        this.redisClient = redisClient;
        this.handCashConnect = new HandCashConnect({
            appId: config.handCashAppId,
            appSecret: config.handCashAppSecret,
        });
    }
    getRedirectionUrl() {
        return this.handCashConnect.getRedirectionUrl();
    }

    async handleCallback(req, res) {
        const { authToken } = req.query;

        try {
            if (!authToken) {
                throw new Error('Missing authToken');
            }

            const account = this.handCashConnect.getAccountFromAuthToken(authToken);

            const profile = await account.getProfile();

            const userId = req.session.userId;

            setUserAuthToken(userId, authToken, this.redisHandler.client);

            req.session.profile = profile;

            req.session.authToken = authToken;

            res.redirect('/success');
        } catch (error) {
            console.error(error);

            res.status(400).send(error.message || 'Invalid authToken');
        }
    }
}

module.exports = HandCashAuth;