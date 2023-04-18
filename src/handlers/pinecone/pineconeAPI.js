const { PineconeClient } = require('@pinecone-database/pinecone');
const { DirectoryLoader, JSONLoader, JSONLinesLoader, TextLoader, CSVLoader } = require("langchain/document_loaders");
const { OpenAIEmbeddings } = require("langchain/embeddings");
const { PineconeStore } = require("langchain/vectorstores");

if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
    throw new Error('Pinecone environment or api key vars missing');
}

async function initPinecone() {
    try {
        const pinecone = new PineconeClient();

        await pinecone.init({
            environment: process.env.PINECONE_ENVIRONMENT ?? '',
            apiKey: process.env.PINECONE_API_KEY ?? '',
        });
        pinecone.projectName = 'discordtest';

        return pinecone;
    } catch (error) {
        console.log('error', error);
        throw new Error('Failed to initialize Pinecone Client');
    }
}

async function uploadDocumentToPinecone(fileBuffer, fileType) {
    let loader;
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
    const document = new Document({ fileBuffer, fileType });

    switch (fileType) {
        case 'json':
            loader = new JSONLoader();
            break;
        case 'jsonl':
            loader = new JSONLinesLoader();
            break;
        case 'csv':
            loader = new CSVLoader();
            break;
        case 'txt':
        default:
            loader = new TextLoader();
            break;
    }

    try {
        const pageContent = await loader.load(fileBuffer);
        document.pageContent = pageContent;

        await PineconeStore.fromDocuments([document], new OpenAIEmbeddings(), {
            pineconeIndex,
        });

        return document.id;
    } catch (error) {
        throw new Error(`Failed to upload document: ${error.message}`);
    }
}

async function loadDocuments() {
    const loader = new DirectoryLoader("example_data", {
        ".json": (path) => new JSONLoader(path, "/texts"),
        ".jsonl": (path) => new JSONLinesLoader(path, "/html"),
        ".txt": (path) => new TextLoader(path),
        ".csv": (path) => new CSVLoader(path, "text"),
    });
    const docs = await loader.load();
    console.log({ docs });
    return docs;
}

async function getPineconeEmbedding(text, model = 'text-embedding-ada-002') {
    const client = await initPinecone();
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
    const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), { pineconeIndex });

    const result = await vectorStore.similaritySearch(text, 1);
    return result;
}

module.exports = {
    getPineconeEmbedding,
    uploadDocumentToPinecone,
    initPinecone,
    loadDocuments,
};
