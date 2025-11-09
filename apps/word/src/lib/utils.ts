import { CONSTANTS } from "@workspace/word/lib/consts";
import Group = Office.Group;


// @ts-expect-error meta.env.MODE
export const isDev = import.meta.env.MODE === "development";
export const baseUrl = isDev
  ? "https://localhost:8000"
  : "https://word.projdocs.com";

export function saveSettings(): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.document.settings.saveAsync((res) => {
      if (res.status === Office.AsyncResultStatus.Succeeded) resolve();
      else reject(res.error);
    });
  });
}

export const setButtons = async (map: Array<[ string, Array<Office.Control> ]>) =>
  await Office.ribbon.requestUpdate({
    tabs: [
      {
        id: CONSTANTS.WORD.TAB.ID,
        groups: map.map(([ item, record ]) => (
            {
              id: item,
              controls: record,
            } satisfies Group
          )
        ),
      },
    ],
  });

export type FileBlob = {
  blob: Blob;
  hash: string;
}

export const getFileBlob = async (): Promise<FileBlob> => {
  const file = await new Promise<Office.File>((resolve, reject) => {
    Office.context.document.getFileAsync(Office.FileType.Compressed, (res) => {
      console.log(res);
      if (res.status === Office.AsyncResultStatus.Succeeded) resolve(res.value);
      else reject(res.error || new Error("getFileAsync failed"));
    });
  }).catch(e => {
    console.error(e);
    return null;
  });
  if (file === null) throw new Error("an unexpected error occurred while loading the file's contents");

  const bytes = await readAllSlices(file);
  file.closeAsync();


  const blob = new Blob([ bytes ], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", });

  // compute SHA-256 hash
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return ({
    blob,
    hash: hashHex,
  });
};

async function readAllSlices(file: Office.File): Promise<Uint8Array> {
  // Preallocate buffer if size is known; otherwise push to an array and concat.
  const chunks: Uint8Array[] = [];
  const sliceCount = file.sliceCount;

  for (let i = 0; i < sliceCount; i++) {
    // slice.data might be a string (base64) or an ArrayBuffer / Uint8Array, depending on host.
    const { data } = await new Promise<Office.Slice>((resolve, reject) => file.getSliceAsync(i, (res) => {
      if (res.status === Office.AsyncResultStatus.Succeeded) resolve(res.value);
      else reject(res.error || new Error(`getSliceAsync(${i}) failed`));
    }));
    chunks.push(toUint8Array(data));
  }

  // Concatenate all chunks
  const totalLen = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function toUint8Array(data: unknown): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof data === "string") return base64ToBytes(data);
  if (Array.isArray(data)) return new Uint8Array(data as number[]);
  if (typeof DataView !== "undefined" && data instanceof DataView) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new Error(
    `Unknown slice data type: ${Object.prototype.toString.call(data)}`
  );
}

function base64ToBytes(b64: string): Uint8Array {
  // atob works in Office WebView; if you’re in Node for tests, use Buffer.from(b64, 'base64')
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i) & 0xff;
  return bytes;
}