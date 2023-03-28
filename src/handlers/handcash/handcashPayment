// Require axios and config/handcash
const axios = require("axios").default;
const config = require('../../config/handcash');

// Create a payment request object
function createPaymentRequest(product, receivers, webhookUrl, customParameters) {
    return {
        product,
        receivers,
        requestedUserData: ['paymail'],
        notifications: {
            webhook: {
                customParameters,
                webhookUrl,
            },
            email: 'jamesharbeck@cipherproxy.com',
        },
        expirationType: 'never',
        redirectUrl: 'https://cipherproxy.com/',
    };
}

// Send the payment request to HandCash
async function sendPaymentRequest(paymentRequest) {
    const webhookUrl = config.webhookUrl;
    const options = {
        method: 'POST',
        url: 'https://cloud.handcash.io/v2/paymentRequests',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'app-secret': config.handCashAppSecret,
            'app-id': config.handCashAppId,
        },
        data: paymentRequest,
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// Export functions
module.exports = {
    createPaymentRequest,
    sendPaymentRequest,
};
