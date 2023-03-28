// Require necessary modules
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Path to costs.json file
const costsFile = path.join(__dirname, '..', 'config', 'costs.json');

// Read and update costs.json file
function updateTotalCost(cost) {
    // Read the contents of the file
    let costs = JSON.parse(fs.readFileSync(costsFile));

    // Update the total cost
    costs.totalCost += cost;

    // Write the updated content to the file
    fs.writeFileSync(costsFile, JSON.stringify(costs));
}

// Get the total cost from the costs.json file
function getTotalCost() {
    const costs = JSON.parse(fs.readFileSync(costsFile));
    return costs.totalCost;
}

// Get response from GPT-4 model
async function getGPTResponse(prompt, systemContent) {
    try {
        // Make a POST request to OpenAI API
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4',
                messages: [{
                        role: 'system',
                        content: systemContent,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        // Get the response from the API
        const aiResponse = response.data.choices[0].message.content ? response.data.choices[0].message.content.trim() : 'Error: Unable to generate a response.';
        return aiResponse;
    } catch (error) {
        console.error(error);
        return 'Error: Unable to generate a response.';
    }
}

// Get image response from OpenAI API
async function getImageResponse(prompt) {
    try {
        // Make a POST request to OpenAI API
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations', {
                prompt: `${prompt}, high quality, digital art, photorealistic style, very detailed, runescape themed`,
                n: 1,
                size: '512x512',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        // Get the image URL from the response
        const imageURL = response.data.data[0].url;

        if (!imageURL) {
            throw new Error();
        }

        return imageURL;
    } catch (error) {
        console.error('Error generating image');
        return 'Error: Unable to generate an image.';
    }
}

// Upload and read a file
async function uploadAndReadFile(file) {
    try {
        // Create a form data object
        const formData = new FormData();
        formData.append('purpose', 'answers');
        formData.append('file', fs.createReadStream(file));

        // Make a POST request to OpenAI API
        const response = await axios.post(
            'https://api.openai.com/v1/files',
            formData, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    ...formData.getHeaders(),
                },
            }
        );

        // Get the file ID from the response
        const file_id = response.data.id;

        // Make a GET request to OpenAI API to get the file content
        const fileContentResponse = await axios.get(`https://api.openai.com/v1/files/${file_id}/content`, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        });

        return fileContentResponse.data;
    } catch (error) {
        console.error(error);
        return {
            error: 'Error: Unable to upload and read the file.'
        };
    }
}

// Export functions
module.exports = {
    getGPTResponse,
    getImageResponse,
    uploadAndReadFile,
    getTotalCost,
    updateTotalCost,
};