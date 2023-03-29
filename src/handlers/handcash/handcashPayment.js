const axios = require("axios").default;
const config = require('../../config/handcash');

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
            email: config.email,
        },
        expirationType: 'never',
        redirectUrl: config.redirectUrl,
    };
}

async function sendPaymentRequest(paymentRequest, authToken) {
    const options = {
        method: 'POST',
        url: 'https://cloud.handcash.io/v2/paymentRequests',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'app-secret': config.handCashAppSecret,
            'app-id': config.handCashAppId,
            'Authorization': `Bearer ${authToken}`,
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

module.exports = {
    createPaymentRequest,
    sendPaymentRequest,
};