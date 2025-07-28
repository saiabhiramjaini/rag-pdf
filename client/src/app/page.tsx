"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");

  const handleFileChange = async (files: File[]) => {
    console.log(files);

    if (files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      console.log(data);

      // Set success state
      setHasUploadedFile(true);
      setUploadedFileName(file.name);
      setUploadError("");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload file. Please try again.");
      setHasUploadedFile(false);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setHasUploadedFile(false);
    setUploadedFileName("");
    setUploadError("");
  };

  return (
    <>
      <div className="min-h-[92vh] w-screen flex">
        <div className="w-1/3 p-4">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {/* Upload Status */}
            {hasUploadedFile && (
              <Alert className="w-full mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <span>File uploaded: {uploadedFileName}</span>
                    <button
                      onClick={resetUpload}
                      className="text-xs underline hover:no-underline"
                    >
                      Upload new file
                    </button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Error */}
            {uploadError && (
              <Alert variant="destructive" className="w-full mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* File Upload Component */}
            {!hasUploadedFile && (
              <Card className="w-full">
                <CardContent className="p-6">
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Uploading and processing your PDF...
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        This may take a few moments
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Upload className="h-5 w-5" />
                        <h3 className="font-semibold">Upload PDF</h3>
                      </div>
                      <FileUpload onChange={handleFileChange} />
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload a PDF file to start chatting with its content
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upload Instructions */}
            {hasUploadedFile && (
              <Card className="w-full">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Ready to chat!</h4>
                  <p className="text-sm text-muted-foreground">
                    Your PDF has been processed. You can now ask questions about its content in the chat interface.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="w-2/3 p-4">
          <div className="h-full">
            <ChatInterface hasUploadedFile={hasUploadedFile} />
          </div>
        </div>
      </div>
    </>
  );
}