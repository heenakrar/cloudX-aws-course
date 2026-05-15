import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    if (!file) return;

    const authorizationToken = localStorage.getItem("authorization_token")?.trim();
    if (!authorizationToken) {
      console.error("Missing authorization_token in localStorage");
      return;
    }

    const authorizationHeader = authorizationToken.startsWith("Basic ")
      ? authorizationToken
      : `Basic ${authorizationToken}`;

    console.log("uploadFile to", url, "Authorization:", authorizationHeader);

    try {
      const response = await fetch(`${url}?name=${encodeURIComponent(file.name)}`, {
        method: "GET",
        headers: {
          Authorization: authorizationHeader,
        },
      });

      if (!response.ok) throw new Error('Failed to get signed URL');

      const signedUrl = await response.text();
      console.log("File to upload: ", file.name);
      console.log("Uploading to: ", signedUrl);

      const result = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "text/csv",
        },
      });

      if (result.ok) {
        console.log("Result: Upload successful!");
        setFile(undefined);
      } else {
        console.error("Upload failed", result.statusText);
      }
    } catch (error) {
      console.error("Error during upload:", error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
