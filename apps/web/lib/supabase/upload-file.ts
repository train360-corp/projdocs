import * as tus from "tus-js-client";
import { DetailedError, OnSuccessPayload } from "tus-js-client";
import { v4 } from "uuid";
import { Tables } from "@workspace/supabase/types";



export const uploadFile = async (supabase: SupabaseClient, options: {
  file: {
    object: Pick<Tables<"files">, "id"> | null;
    data: File | Blob;
  },
  directory: Pick<Tables<"directories">, "id">;
  bucket: string,
  onError?: (error: Error | DetailedError) => void,
  onProgress?: (progress: number) => void,
  onSuccess?: (response: OnSuccessPayload) => void,
}) => {

  const supabaseAccessToken = (await supabase.auth.getSession()).data.session?.access_token;
  if (!supabaseAccessToken) {
    throw new Error("User must be logged in.");
  }

  const url = new URL(window.env.SUPABASE_PUBLIC_URL);
  url.pathname = "/storage/v1/upload/resumable";
  const endpoint = url.toString();

  const upload = new tus.Upload(options.file.data, {
    endpoint,
    retryDelays: [ 0, 3000, 5000, 10000, 20000 ],
    headers: {
      authorization: `Bearer ${supabaseAccessToken}`,
      apikey: window.env.SUPABASE_PUBLIC_KEY,
    },
    uploadDataDuringCreation: true, // Send metadata with file chunks
    removeFingerprintOnSuccess: true, // Remove fingerprint after successful upload
    chunkSize: 6 * 1024 * 1024, // Chunk size for TUS uploads (6MB)
    metadata: {
      bucketName: options.bucket,
      objectName: v4(),
      contentType: options.file.data.type,
      cacheControl: "3600",
      metadata: JSON.stringify({
        file_id: options.file.object?.id ?? null,
        directory_id: options.directory.id,
        filename: "name" in options.file.data ? options.file.data.name : "unnamed"
      }),
    },
    onError: (error) => options.onError ? options.onError(error) : console.error("Upload failed:", error),
    onProgress: (bytesUploaded, bytesTotal) => options.onProgress && options.onProgress(((bytesUploaded / bytesTotal) * 100)),
    onSuccess: (response) => options.onSuccess && options.onSuccess(response),
  });

  upload.start();
};