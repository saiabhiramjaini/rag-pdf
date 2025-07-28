import { Request, Response } from "express";
import { fileUploadQueue } from "../config/queue";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    console.log(req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    await fileUploadQueue.add("file-read", {
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    });

    res.json({
      message: "File uploaded successfully",
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
};
