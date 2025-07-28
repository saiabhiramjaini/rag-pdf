
// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import uploadRoutes from "./routes/uploadRoutes";
import chatRoutes from "./routes/chatRoutes";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use(express.json());

app.get("/health-check", (req, res) => {
  res.send("OK");
});

app.use("/", uploadRoutes);
app.use("/", chatRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});