const axios = require('axios'); // Importing axios library
const { HandCashConnect, Permissions } = require('@handcash/handcash-connect'); // Importing HandCashConnect and Permissions from @handcash/handcash-connect
const HandCashAuth = require('./handcashAuth'); // Importing HandCashAuth class from handcashAuth.js
const { createPaymentRequest, sendPaymentRequest, } = require('./handcashpayment'); // Importing createPaymentRequest and sendPaymentRequest functions from handcashpayment.js

class HandCashManager {
    constructor(appId, appSecret) { // Constructor for HandCashManager class
        this.appId = appId;
        this.appSecret = appSecret;
        this.handCashConnect = new HandCashConnect({ // Creating instance of HandCashConnect
            appId,
            appSecret
        });
        this.handCashAuth = new HandCashAuth(); // Creating instance of HandCashAuth
    }

    async createPaymentRequest(paymentData, webhookUrl, authToken) { // Function to create payment request
        const paymentRequest = createPaymentRequest(paymentData.product, paymentData.receivers, webhookUrl, paymentData.customParameters); // Creating payment request using imported function
        const response = await sendPaymentRequest(paymentRequest); // Sending payment request using imported function
        return response;
    }

    async chargeConnectedUserWithAuthToken(userId, authToken, amount, webhookUrl) { // Function to charge connected user with auth token
        const paymentData = { // Payment data object
            product: {
                name: 'AI Interaction',
                description: 'Charge for AI Interaction',
            },
            receivers: [{
                currencyCode: 'USD',
                sendAmount: amount,
                destination: '$handle', // Replace this with the HandCash handle to receive the payment
            }, ],
            requestedUserData: ['paymail'],
            customParameters: {
                userId: userId,
                webhookUrl: webhookUrl
            },
            email: 'your@email.com',
            expirationType: 'never',
            redirectUrl: 'https://yourapp.com/success',
        };

        const paymentRequest = await this.createPaymentRequest(paymentData, webhookUrl, authToken); // Calling createPaymentRequest function

        return paymentRequest.paymentRequestUrl; // Returning payment request URL
    }

    async checkUserPermissions(userId) { // Function to check user permissions
        const authToken = await this.handCashAuth.getAuthTokenForUser(userId); // Getting auth token for user
        const cloudAccount = this.handCashConnect.getAccountFromAuthToken(authToken); // Getting cloud account from auth token
        const userPermissions = await cloudAccount.profile.getPermissions(); // Getting user permissions
        return userPermissions; // Returning user permissions
    }

    async requestUserPermission(userId, permission) { // Function to request user permission
        const authToken = await this.handCashAuth.getAuthTokenForUser(userId); // Getting auth token for user
        const cloudAccount = this.handCashConnect.getAccountFromAuthToken(authToken); // Getting cloud account from auth token
        const userPermissions = await cloudAccount.profile.getPermissions(); // Getting user permissions

        if (userPermissions.includes(permission)) { // Checking if user has permission
            return true;
        } else {
            const redirectionUrl = this.handCashConnect.getRedirectionUrl({ // Getting redirection URL
                state: {
                    userId,
                    permission
                },
            });
            return {
                permissionNeeded: true,
                redirectionUrl
            };
        }
    }
}

module.exports = HandCashManager; // Exporting HandCashManager class
