const asyncRedis = require('async-redis');
const config = require('../../config/handcash');

class RedisHandler {
  constructor() {
    this.client = asyncRedis.createClient(config.redisUrl);
  }

  async getUserAuthToken(userId) {
    try {
      const authToken = await this.client.get(`authToken:${userId}`);
      return authToken;
    } catch (error) {
      console.error('Error getting user auth token:', error);
      throw error;
    }
  }

  async setUserAuthToken(userId, authToken) {
    try {
      await this.client.set(`authToken:${userId}`, authToken);
    } catch (error) {
      console.error('Error saving user auth token:', error);
      throw error;
    }
  }

  async deleteUserAuthToken(userId) {
    try {
      await this.client.del(`authToken:${userId}`);
    } catch (error) {
      console.error('Error deleting user auth token:', error);
      throw error;
    }
  }

async getUserPaymentStatus(userId) {
    try {
      const paymentStatus = await this.client.get(`paymentStatus:${userId}`);
      return paymentStatus;
    } catch (error) {
      console.error('Error getting user payment status:', error);
      throw error;
    }
  }
}

module.exports = RedisHandler;


