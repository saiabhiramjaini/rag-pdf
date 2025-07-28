import { Request, Response } from "express";
import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "../config/embeddings";

export const chat = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName: "pdf-docs",
      }
    );

    const retriever = vectorStore.asRetriever({
      k: 2,
    });

    const results = await retriever.invoke(query);
    console.log("Retrieved context:", results);

    let answer;

    // Try Gemini API first, fallback to simple response
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a helpful AI assistant. Answer the user's query based on the following context from a PDF document. If the context doesn't contain relevant information, say so.

Context:
${results.map((doc) => doc.pageContent).join("\n\n")}

User Query: ${query}

Please provide a helpful answer based on the context above.`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const geminiResponse = await response.json();
          answer =
            geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I couldn't generate a response from Gemini.";
        } else {
          throw new Error("Gemini API failed");
        }
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        answer = generateSimpleAnswer(query, results);
      }
    } else {
      // Fallback response without Gemini
      answer = generateSimpleAnswer(query, results);
    }

    return res.json({
      query,
      answer,
      context: results.map((doc) => ({
        content: doc.pageContent.substring(0, 200) + "...",
        metadata: doc.metadata,
      })),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat request failed. Please try again." });
  }
};

function generateSimpleAnswer(query: string, results: any[]): string {
  if (!results || results.length === 0) {
    return "I couldn't find any relevant information in the PDF to answer your query.";
  }

  const contextText = results.map((doc) => doc.pageContent).join("\n\n");

  // Simple keyword matching for basic responses
  const queryLower = query.toLowerCase();
  const contextLower = contextText.toLowerCase();

  if (contextLower.includes(queryLower.replace(/\?/g, ""))) {
    return `Based on the PDF content, here's what I found:\n\n${contextText.substring(
      0,
      500
    )}${contextText.length > 500 ? "..." : ""}`;
  }

  // Check for common question patterns
  if (
    queryLower.includes("what is") ||
    queryLower.includes("who is") ||
    queryLower.includes("where is")
  ) {
    return `Here's the relevant information from the PDF:\n\n${contextText.substring(
      0,
      400
    )}${contextText.length > 400 ? "..." : ""}`;
  }

  return `I found some related content in the PDF:\n\n${contextText.substring(
    0,
    300
  )}${
    contextText.length > 300 ? "..." : ""
  }\n\nThis might help answer your question about: ${query}`;
}
