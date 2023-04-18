const axios = require('axios');
const fs = require('fs');
const path = require('path');

const costsFile = path.join(__dirname, '..', 'config', 'costs.json');

function updateTotalCost(cost) {
    let costs = JSON.parse(fs.readFileSync(costsFile));

    costs.totalCost += cost;

    fs.writeFileSync(costsFile, JSON.stringify(costs));
}

function getTotalCost() {
    const costs = JSON.parse(fs.readFileSync(costsFile));
    return costs.totalCost;
}

async function getGPTResponse(prompt, systemContent) {
    try {
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
            temperature: 0.9,
            max_tokens: 300,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
        }
        );
        const aiResponse = response.data.choices[0].message.content ? response.data.choices[0].message.content.trim() : 'Error: Unable to generate a response.';
        return aiResponse;
    } catch (error) {
        console.error(error);
        return 'Error: Unable to generate a response.';
    }
}

async function getImageResponse(prompt) {
    try {
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

module.exports = {
    getGPTResponse,
    getImageResponse,
    getTotalCost,
    updateTotalCost,
};




////Pinecone docs implementation not working 
// const client = new PineconeClient();
// client.init({  
//   environment: process.env.PINECONE_ENVIRONMENT,  
//   apiKey: process.env.PINECONE_API_KEY,
// });
// const pineconeIndex = client.Index(process.env.PINECONE_INDEX);


// //OpenAI native file upload function
// async function uploadAndReadFile(file) {
//     try {
//         const formData = new FormData();
//         formData.append('purpose', 'answers');
//         formData.append('file', fs.createReadStream(file));

//         const response = await axios.post(
//             'https://api.openai.com/v1/files',
//             formData, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//                 ...formData.getHeaders(),
//             },
//         }
//         );

//         const file_id = response.data.id;

//         const fileContentResponse = await axios.get(`https://api.openai.com/v1/files/${file_id}/content`, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//             },
//         });

//         return fileContentResponse.data;
//     } catch (error) {
//         console.error(error);
//         return {
//             error: 'Error: Unable to upload and read the file.'
//         };
//     }
// }



// //OpenAI native embeddings function (use this instead of getLangChainEmbedding function)
// async function getEmbedding(text, model = 'text-embedding-ada-002') {
//     const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

//     const response = await fetch('https://api.openai.com/v1/embeddings', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${OPENAI_API_KEY}`,
//         },
//         body: JSON.stringify({
//             input: text,
//             model: model,
//         }),
//     });

//     if (response.ok) {
//         const data = await response.json();
//         return data.data[0].embedding;
//     } else {
//         throw new Error('Failed to fetch embedding');
//     }
// }