import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantClient } from "@qdrant/js-client-rest";
import { embeddings } from "./config/embeddings";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log(job.data);

    try {
      // Load the PDF
      const loader = new PDFLoader(job.data.path);
      const docs = await loader.load();

      // Optional: Split documents into smaller chunks
      const textSplitter = new CharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const splitDocs = await textSplitter.splitDocuments(docs);

      const client = new QdrantClient({ url: "http://localhost:6333" });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: "http://localhost:6333",
          collectionName: "pdf-docs",
        }
      );

      await vectorStore.addDocuments(splitDocs);

      console.log("Documents added to vector store");
    } catch (error) {
      console.error("Worker error:", error);
      throw error;
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed with error: ${err.message}`);
});
