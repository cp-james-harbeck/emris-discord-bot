require('dotenv').config();
const chalk = require('chalk');
const logger = require('@mirasaki/logger');
const express = require('express');
const config = require('../config/handcash');
const bodyParser = require('body-parser');
const { HandCashConnect } = require('@handcash/handcash-connect');
const HandCashManager = require('../handlers/handcash/handcashManager');
const HandCashAuth = require('../handlers/handcash/HandCashAuth');
const commandRoutes = require('./commands.routes');
const RedisHandler = require('../handlers/handcash/redisHandler');
const redisHandler = new RedisHandler();

const { NODE_ENV, PORT = 3000 } = process.env;
const app = express();
app.use(bodyParser.json());

app.use((error, res, next) => {
  if (error) {
    logger.error(chalk.red(`Internal server error: ${error.message}`));
    res.status(500).send('Internal server error');
  } else {
    next();
  }
});

const handCashManager = new HandCashManager(
  config.handCashAppId,
  config.handCashAppSecret,
  redisHandler
);

const handCashAuth = new HandCashAuth(redisHandler, redisHandler.client);

const handCashConnect = new HandCashConnect({
  appId: config.handCashAppId,
  appSecret: config.handCashAppSecret,
  redisHandler
});

app.use('/api/commands', commandRoutes);
app.use('/', express.static('docs', { extensions: ['html'] }));
app.use(express.static('public'));

app.get('/authenticate-user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const state = encodeURIComponent(
      JSON.stringify({
        userId,
      })
    );
    const redirectionUrl = handCashAuth.getRedirectionUrl({
      permissions: [Permissions.Pay],
      state,
    });
    res.redirect(redirectionUrl);
  } catch (error) {
    logger.error(chalk.red(`Error authenticating user: ${error}`));
    res.status(500).send('Error authenticating user');
  }
});

app.get('/charge-user/:userId', async (req, res) => {
  const userId = req.params.userId;
  const amount = 0.001;

  try {
    const authToken = await redisHandler.getUserAuthToken(userId);
    if (!authToken) {
      const redirectionUrl = handCashConnect.getRedirectionUrl({
        permissions: [Permissions.Pay],
        state: JSON.stringify({ userId }),
      });
      res.redirect(redirectionUrl);
      return;
    }
    const paymentRequestUrl = await handCashManager.chargeConnectedUserWithAuthToken(
      userId,
      authToken,
      amount
    );
    res.json({ paymentRequestUrl });
  } catch (error) {
    logger.error(chalk.red(`Error creating payment request: ${error}`));
    res.status(500).send('Error creating payment request');
  }
});

app.delete('/delete-user-auth/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    await redisHandler.deleteUserAuthToken(userId);
    res.sendStatus(200);
  } catch (error) {
    logger.error(chalk.red(`Error deleting user auth token: ${error}`));
    res.status(500).send('Error deleting user auth token');
  }
});

app.post('/webhook/payment-status', async (req, res) => {
  const { userId, status } = req.body;
  await updateUserPaymentStatus(userId, status);
  res.sendStatus(200);
});

app.use('*', (next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, res) => {
  logger.error(chalk.red(`Internal server error: ${error.message}`));
  res.status(error.status || 500).send('Internal server error');
});

app.listen(PORT, () => {
  logger.success(chalk.yellow.bold(`API running in ${NODE_ENV}-mode on port ${PORT}`));
}).on('error', (error) => {
  logger.syserr(chalk.red(`Server error: ${error.message}`));
});