// Require the Redis module
const redis = require('redis');

// Create a new Redis client with the given URL
const redisClient = redis.createClient(redisUrl)

// Get the authToken for the user from Redis
async function getUserAuthToken(userId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Get the authToken from Redis
            redisClient.get(userId, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}

// Save the authToken for the user to Redis
function saveUserAuthToken(userId, authToken) {
    // Set the authToken in Redis
    redisClient.set(userId, authToken);
}

// Delete the authToken for the user from Redis
function deleteUserAuthToken(userId) {
    // Delete the authToken from Redis
    redisClient.del(userId);
}

// Export the functions
module.exports = {
    getUserAuthToken,
    saveUserAuthToken,
    deleteUserAuthToken,
};