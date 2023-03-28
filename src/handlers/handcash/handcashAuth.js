// Require the HandCashConnect module
const { HandCashConnect } = require('@handcash/handcash-connect');

// Require the config file
const config = require('../../config/handcash');

// Create a class for HandCashAuth
class HandCashAuth {
    // Constructor to create an instance of HandCashConnect
    constructor() {
        this.handCashConnect = new HandCashConnect({
            appId: config.handCashAppId,
            appSecret: config.handCashAppSecret,
        });
    }

    // Function to get the redirection URL
    getRedirectionUrl() {
        return this.handCashConnect.getRedirectionUrl();
    }

    // Async function to handle the callback from HandCash
    async handleCallback(req, res) {
        // Get the authToken from the request query
        const { authToken } = req.query;

        try {
            // Throw an error if the authToken is missing
            if (!authToken) {
                throw new Error('Missing authToken');
            }

            // Get the account from the authToken
            const account = this.handCashConnect.getAccountFromAuthToken(authToken);

            // Get the profile from the account
            const profile = await account.getProfile();

            // Set the authToken in the session
            req.session.authToken = authToken;

            // Redirect to the success page
            res.redirect('/success');
        } catch (error) {
            // Log the error
            console.error(error);

            // Send the error message or invalid authToken message
            res.status(400).send(error.message || 'Invalid authToken');
        }
    }
}

// Export the HandCashAuth class
module.exports = HandCashAuth;