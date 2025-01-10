import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';

// Function to upload a file to Azure Blob Storage
const uploadToAzure = async (file, email) => {
  const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  // Validate environment variables
  if (!AZURE_STORAGE_CONNECTION_STRING || !containerName) {
    throw new Error('Azure storage connection string or container name is missing.');
  }

  try {
    // Create the BlobServiceClient object
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Generate a unique name for the blob (file)
    const blobName = `${email}`;

    // Get the path of the uploaded file in the local 'uploads/' directory
    const filePath = path.join('uploads', email);

    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Check if the blob already exists
    // const exists = await blockBlobClient.exists();
    // if (exists) {
    //   // Delete the existing blob
    //   console.log('Blob already exists. Deleting the existing blob...');
    //   await blockBlobClient.delete();
    //   console.log('Blob deleted successfully.');
    // }

    // Upload the file to Azure Blob Storage from the local 'uploads/' folder
    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: { blobContentType: file.mimetype }, // Set the file type (MIME type)
    });

    // Delete the file from the local 'uploads/' folder after uploading to Azure Blob Storage
    fs.unlinkSync(filePath); // This deletes the file from the local file system

    // Return the URL of the uploaded file
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading file to Azure:', error);
    throw new Error('Failed to upload file to Azure Blob Storage');
  }
};

export default uploadToAzure;
