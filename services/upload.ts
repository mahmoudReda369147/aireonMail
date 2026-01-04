import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput
} from "@aws-sdk/client-s3";

// Create S3 client
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Upload a file to S3 bucket
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name to give the file in S3
 * @param contentType - The content type of the file
 * @returns The URL of the uploaded file
 */
export const uploadToS3 = async (
  fileBuffer: ArrayBuffer | Uint8Array | Blob,
  fileName: string,
  contentType: string
): Promise<string> => {
  try {
    const params: PutObjectCommandInput = {
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: "public-read"
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Construct public URL manually
    const bucket = import.meta.env.VITE_AWS_S3_BUCKET_NAME;
    const region = import.meta.env.VITE_AWS_REGION;

    return `https://${bucket}.s3.${region}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to upload file to S3: ${errorMessage}`);
  }
};
