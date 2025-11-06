import * as tus from "tus-js-client";
import { DetailedError, OnSuccessPayload } from "tus-js-client";
import { v4 } from "uuid";
import { SupabaseClient, Tables } from "@workspace/supabase/types";


type UploadableFile = {
  type: "file";
  data: File;
  object: Pick<Tables<"files">, "id"> | null;
}

type UploadableBlob = {
  type: "blob";
  data: Blob;
  object: Pick<Tables<"files">, "id"> | null;
  name: string;
}

type UploadableBuffer = {
  type: "buffer";
  data: Buffer;
  object: Pick<Tables<"files">, "id"> | null;
  mimeType: string;
  name: string;
}

type Uploadable = UploadableFile | UploadableBlob | UploadableBuffer;

const getName : (upload: Uploadable) => string = (upload) => {
  switch (upload.type) {
    case "file":
      return upload.data.name;
    case "blob":
      return upload.name;
    case "buffer":
      return upload.name;
    default:
      // @ts-ignore
      throw new Error(`unhandled type: ${upload.type}`)
  }
}

const getType: (upload: Uploadable) => string = (upload) => {
  switch (upload.type) {
    case "file":
      return upload.data.type;
    case "blob":
      return upload.data.type;
    case "buffer":
      return upload.mimeType;
    default:
      // @ts-ignore
      throw new Error(`unhandled type: ${upload.type}`)
  }
}

export const uploadFile = async (supabase: SupabaseClient, options: {
  file: Uploadable,
  directory: Pick<Tables<"directories">, "id">;
  bucket: string,
  onError?: (error: Error | DetailedError) => void,
  onProgress?: (progress: number) => void,
  onSuccess?: (response: OnSuccessPayload) => void,
  retry?: false;
}) => {

  const supabaseAccessToken = (await supabase.auth.getSession()).data.session?.access_token;
  if (!supabaseAccessToken) {
    throw new Error("User must be logged in.");
  }

  const upload = new tus.Upload(options.file.data, {
    // @ts-ignore
    endpoint: `${supabase.storage.url}/upload/resumable`,
    retryDelays: !options.retry ? undefined : [ 0, 3000, 5000, 10000, 20000 ],
    headers: {
      authorization: `Bearer ${supabaseAccessToken}`,
      // @ts-ignore
      apikey: supabase.supabaseKey,
    },
    uploadDataDuringCreation: true, // Send metadata with file chunks
    removeFingerprintOnSuccess: true, // Remove fingerprint after successful upload
    chunkSize: 6 * 1024 * 1024, // Chunk size for TUS uploads (6MB)
    metadata: {
      bucketName: options.bucket,
      objectName: v4(),
      contentType: getType(options.file),
      cacheControl: "3600",
      metadata: JSON.stringify({
        file_id: options.file.object?.id ?? null,
        directory_id: options.directory.id,
        filename: getName(options.file),
      }),
    },
    onError: (error) => options.onError ? options.onError(error) : console.error("Upload failed:", error),
    onProgress: (bytesUploaded, bytesTotal) => options.onProgress && options.onProgress(((bytesUploaded / bytesTotal) * 100)),
    onSuccess: (response) => options.onSuccess && options.onSuccess(response),
  });

  upload.start();
};