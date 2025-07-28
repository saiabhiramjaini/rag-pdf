// src/routes/uploadRoutes.ts
import express from "express";
import { uploadFile } from "../controllers/uploadController";
import { upload } from "../middleware/multer";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFile);

export default router;