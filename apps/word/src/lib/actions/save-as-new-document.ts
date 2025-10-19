import { baseUrl } from "@workspace/word/lib/utils";
import { AuthSettings } from "@workspace/desktop/src/lib/auth/store";
import { CONSTANTS } from "@workspace/word/lib/consts";



const saveToDisk = async (docId: number) => {
  const props = await new Promise<Office.FileProperties>((resolve, reject) => {
    Office.context.document.getFilePropertiesAsync((res) => {
      if (res.status === Office.AsyncResultStatus.Succeeded) resolve(res.value);
      else reject(res.error);
    });
  }).catch(() => ({
    url: ""
  } satisfies Office.FileProperties));

  await Word.run(async ctx => {
    if (props.url.trim().length === 0) ctx.document.save(Word.SaveBehavior.save, `${docId}`);
    else ctx.document.save(Word.SaveBehavior.save);
    await ctx.sync();
  });
};


export const saveAsNewFile: Action = async () => {
  console.log("✅ saveAsNewFile() was called");


  const auth = await fetch(`${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/user`).then<AuthSettings | null>(async (resp) => {
    if (resp.status === 400) {
      throw new Error("not logged in");
    } else if (resp.status === 200) {
      return await resp.json();
    } else {
      throw new Error(`unexpected server response: ${resp.status}`);
    }
  }).catch((e) => {
    console.error(e);
    return null;
  });

  if (auth === null) return;



  Office.context.ui.displayDialogAsync(
    `${baseUrl}/src/surfaces/folder-picker/index.html?supabase-url=${encodeURIComponent(auth.supabase.url)}&token=${encodeURIComponent(auth.token.access_token)}&supabase-key=${encodeURIComponent(auth.supabase.key)}`,
    { height: 75, width: 75 },              // size in % of window
    (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) result.value.addEventHandler(Office.EventType.DialogMessageReceived, async (arg) => {
        if ("message" in arg) {
          switch (arg.message) {
            case "save":

              const file = await new Promise<Office.File>((resolve, reject) => {
                Office.context.document.getFileAsync(Office.FileType.Compressed, (res) => {
                  if (res.status === Office.AsyncResultStatus.Succeeded) resolve(res.value);
                  else reject(res.error || new Error("getFileAsync failed"));
                });
              });

              const bytes = await readAllSlices(file);
              const docxBlob = new Blob([ bytes ], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", });

              return;
            case "close":
              result.value.close();
              return;
            default:
              console.warn(`dialog message type "${arg.message}" is unhandled`);
          }
        } else console.error(arg.error);
      });
      else {
        console.error("Failed to open dialog:", result.error);
      }
    }
  );

  // const form = new FormData();
  // form.append("file", docxBlob, "name" in Office.context.document && typeof Office.context.document.name === "string" && Office.context.document.name.trim().length > 0 ? Office.context.document.name : "document.docx");
  // const res = await fetch("", { // TODO: FIX
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${""}` }, // TODO: FIX
  //   body: form,
  // });
  //
  // if (!res.ok) {
  //   const text = await res.text().catch(() => "");
  //   throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text}`);
  // }
  //
  // return await res.json().catch(() => ({}));

};


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

function base64ToBytes(b64: string): Uint8Array {
  // atob works in Office WebView; if you’re in Node for tests, use Buffer.from(b64, 'base64')
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i) & 0xff;
  return bytes;
}