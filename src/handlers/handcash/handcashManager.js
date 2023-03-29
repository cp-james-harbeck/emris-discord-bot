const { HandCashConnect, Permissions } = require('@handcash/handcash-connect');
const HandCashAuth = require('./HandCashAuth');
const { createPaymentRequest, sendPaymentRequest } = require('./HandCashPayment');
const config = require('../../config/handcash');

class HandCashManager {
    constructor(redisHandler) {
        this.redisHandler = redisHandler;
        this.handCashConnect = new HandCashConnect({
            appId: config.handCashAppId,
            appSecret: config.handCashAppSecret,
        });
        this.handCashAuth = new HandCashAuth(redisHandler);
    }

    async createPaymentRequest(paymentData, webhookUrl, authToken) {
        const paymentRequest = createPaymentRequest(paymentData.product, paymentData.receivers, webhookUrl, paymentData.customParameters);
        const response = await sendPaymentRequest(paymentRequest, authToken);
        return response;
    }    

    async chargeConnectedUserWithAuthToken(userId, authToken, amount) {
        const paymentData = {
            product: {
                name: 'AI Interaction',
                description: 'Charge for AI Interaction',
            },
            receivers: [
                {
                    currencyCode: 'USD',
                    sendAmount: amount,
                    destination: config.paymentDestinationHandle,
                },
            ],
            requestedUserData: ['paymail'],
            customParameters: { userId, webhookUrl: config.webhookUrl },
            email: config.email,
            expirationType: 'never',
            redirectUrl: config.redirectUrl,
        };


        const paymentRequest = await this.createPaymentRequest(paymentData, config.webhookUrl, authToken);

        return paymentRequest.paymentRequestUrl;
    }

    async checkUserPermissions(userId) {
        const authToken = await this.handCashAuth.getAuthTokenForUser(userId);
        const cloudAccount = this.handCashConnect.getAccountFromAuthToken(
          authToken
        );
        const userPermissions = await cloudAccount.profile.getPermissions();
    
        return {
          hasPayPermission: userPermissions.includes(Permissions.Pay),
          permissions: userPermissions,
        };
    }
    

    async requestUserPermission(userId, permission) {
        const authToken = await this.handCashAuth.getAuthTokenForUser(userId);
        const cloudAccount = this.handCashConnect.getAccountFromAuthToken(authToken);
        const userPermissions = await cloudAccount.profile.getPermissions();

        if (userPermissions.includes(permission)) {
            return true;
        } else {
            const redirectionUrl = this.handCashConnect.getRedirectionUrl({
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

module.exports = HandCashManager;
console.log('Exported HandCashManager:', HandCashManager);
