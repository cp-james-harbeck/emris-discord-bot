require('dotenv').config();

module.exports = {
  handCashAppId: process.env.HANDCASH_APP_ID,
  handCashAppSecret: process.env.HANDCASH_APP_SECRET,
  redisUrl: process.env.REDIS_URL,
  // redisPassword: process.env.REDIS_PASSWORD,
  // redisPort: process.env.REDIS_PORT,
  webhookUrl: process.env.WEBHOOK_URL,
};
