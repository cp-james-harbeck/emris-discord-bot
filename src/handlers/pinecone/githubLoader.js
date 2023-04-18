const RecursiveCharacterTextSplitter = require('langchain/text_splitter');
const GithubRepoLoader = require("langchain/document_loaders");
const OpenAIEmbeddings = require('langchain/embeddings');
const PineconeStore = require('langchain/vectorstores');
const pinecone = require('@/utils/pinecone-client');
const { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } = require('@/config/pinecone');
const DirectoryLoader = require('langchain/document_loaders');

/* Name of directory to retrieve your files from */
const filePath = 'docs';

export const run = async () => {
  try {

    // load the markdown files of the algorithm repo by twitter
    const loader = new GithubRepoLoader(
      "https://github.com/misbahsy/the-algorithm-ml-gpt",
      { branch: "main", recursive: true, unknown: "warn" }
    );
    const rawDocs = await loader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

    //embed the repo files
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();