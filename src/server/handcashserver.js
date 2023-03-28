// Require necessary modules
const config = require('../config/handcash');
const express = require('express');
const bodyParser = require('body-parser');
const HandCashManager = require('../../handcash/handcashManager');
const {
    HandCashConnect,
    Permissions
} = require('@handcash/handcash-connect');
const redis = require('async-redis');
const {
    getUserAuthToken,
    saveUserAuthToken,
    deleteUserAuthToken
} = require('../../handcash/redisHandler');

// Create an Express app
const app = express();
app.use(bodyParser.json());

// Create a Redis client
const redisClient = redis.createClient({
    url: config.redisUrl,
    // password: config.redisPassword,
    // port: config.redisPort,
    enable_offline_queue: false,
    retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    },
});

// Execute a Redis command
async function executeRedisCommand(command, ...args) {
    if (!redisClient.connected) {
        await new Promise((resolve) => {
            redisClient.on('ready', () => {
                resolve();
            });
        });
    }

    return redisClient[command](...args);
}

// Create a HandCash Manager instance
const handCashManager = new HandCashManager(config.handCashAppId, config.handCashAppSecret);

// Initialize HandCash Connect SDK
const handCashConnect = new HandCashConnect({
    appId: config.handCashAppId,
    appSecret: config.handCashAppSecret,
});

// Save the user's payment status to Redis
function saveUserPaymentStatus(userId, status) {
    return new Promise((resolve, reject) => {
        const paymentStatusKey = `paymentStatus:${userId}`;
        redisClient.set(paymentStatusKey, status, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

// Replace this with your actual function to update the user's payment status
async function updateUserPaymentStatus(userId, status) {
    try {
        await saveUserPaymentStatus(userId, status);
    } catch (error) {
        console.error(`Error updating user payment status: ${error}`);
    }
}

// Handle webhook from HandCash after successful payment
app.post('/webhook/handcash', async (req, res) => {
    const {
        appSecret,
        paymentRequestId,
        transactionId,
        customParameters
    } = req.body;

    if (appSecret === config.handCashAppSecret) {
        const userId = customParameters.userId;
        await updateUserPaymentStatus(userId, 'PAID');
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
    }
});

// Redirect user to HandCash for authentication
app.get('/authenticate-user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const state = encodeURIComponent(JSON.stringify({
            userId
        }));
        const redirectionUrl = handCashConnect.getRedirectionUrl({
            permissions: [Permissions.Pay],
            state
        });
        res.redirect(redirectionUrl);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error authenticating user');
    }
});

// Example of error handling middleware
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send('Internal server error');
});

// Handle callback from HandCash after user authenticates
app.get('/auth-callback', async (req, res) => {
    const authToken = req.query.authToken;
    const state = JSON.parse(decodeURIComponent(req.query.state));
    const userId = state.userId;

    // Save authToken for user to use in subsequent requests
    saveUserAuthToken(userId, authToken);

    res.send('Authentication successful! You may close this window and return to the app.');
});

// Charge user using HandCash Connect
app.get('/charge-user/:userId', async (req, res) => {
    const userId = req.params.userId;
    const amount = 0.001; // Charge amount in BSV
    const webhookUrl = 'https://yourserver.com/webhook/handcash';

    try {
        const authToken = await getUserAuthToken(userId);
        if (!authToken) {
            const redirectionUrl = handCashConnect.getRedirectionUrl({
                permissions: [Permissions.Pay],
                state: JSON.stringify({
                    userId
                }),
            });
            res.redirect(redirectionUrl);
            return;
        }
        const paymentRequestUrl = await handCashManager.chargeConnectedUserWithAuthToken(userId, authToken, amount, webhookUrl);
        res.json({
            paymentRequestUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating payment request');
    }
});

// Handle webhook from HandCash with payment status
app.post('/webhook/payment-status', async (req, res) => {
    const { userId, status } = req.body;
    await updateUserPaymentStatus(userId, status);
    res.sendStatus(200);
});

// Start the server on the specified port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

// Log errors when connecting to Redis
redisClient.on('error', (error) => {
    console.error(error);
});

// Log success when connected to Redis
redisClient.on('connect', () => {
    console.log('Redis connected');
});

// Log when Redis connection is closed
redisClient.on('end', () => {
    console.log('Redis connection closed');
});

// Log errors when starting the server
app.on('error', (error) => {
    console.error(error);
});