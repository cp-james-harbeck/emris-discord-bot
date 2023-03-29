require('dotenv').config();

module.exports = {
  handCashAppId: process.env.HANDCASH_APP_ID,
  handCashAppSecret: process.env.HANDCASH_APP_SECRET,
  redisUrl: process.env.REDIS_URL,
  webhookUrl: process.env.WEBHOOK_URL,
  email: process.env.PAYMENT_EMAIL,
  redirectUrl: process.env.PAYMENT_REDIRECT_URL,
  paymentDestinationHandle: process.env.PAYMENT_DESTINATION_HANDLE
};