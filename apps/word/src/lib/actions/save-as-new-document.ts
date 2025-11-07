import { baseUrl, saveSettings } from "@workspace/word/lib/utils";
import { Tables } from "@workspace/supabase/types.gen";
import { createClient } from "@workspace/supabase/client";
import { uploadFile } from "@workspace/web/lib/supabase/upload-file";
import { v4 } from "uuid";
import { displayDialog } from "@workspace/word/surfaces/dialog/display";
import { CONSTANTS } from "@workspace/word/lib/consts";
import { launch } from "@workspace/word/lib/actions/launch";



export enum FileSelectorParentMessageTypes {
  CLOSE = "office:file-selector:close",
  SAVE = "office:file-selector:save",
}

export type FileSelectorParentMessage =
  | { type: FileSelectorParentMessageTypes.CLOSE; body: {} }
  | { type: FileSelectorParentMessageTypes.SAVE; body: { directory: Tables<"directories"> } };

export const saveAsNewFile: Action = async () => {
  console.log("✅ saveAsNewFile() was called");

  const url = new URL(`${baseUrl}/src/surfaces/folder-picker/index.html`);

  Office.context.ui.displayDialogAsync(url.toString(),
    { height: 75, width: 75 },              // size in % of window
    (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) result.value.addEventHandler(Office.EventType.DialogMessageReceived, async (arg) => {
        if ("message" in arg) {

          let msg: FileSelectorParentMessage;
          try {
            msg = JSON.parse(arg.message);
          } catch (e) {
            console.error(e);
            return;
          }

          switch (msg.type) {

            case FileSelectorParentMessageTypes.SAVE:

              result.value.close();

              const file = await new Promise<Office.File>((resolve, reject) => {
                Office.context.document.getFileAsync(Office.FileType.Compressed, (res) => {
                  if (res.status === Office.AsyncResultStatus.Succeeded) resolve(res.value);
                  else reject(res.error || new Error("getFileAsync failed"));
                });
              });
              const bytes = await readAllSlices(file);
              const docxBlob = new Blob([ bytes ], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", });


              const supabase = createClient();
              const uid = await supabase.rpc("get_user_id")
              if(uid.error || !uid.data) {
                await displayDialog({
                  title: "Unable to Save",
                  description: "An error occurred while saving file",
                });
                console.error(uid.error ?? "no session returned");
                return
              }

              const fileRow = await supabase.from("files").insert({
                project_id: msg.body.directory.project_id,
                locked_by_user_id: uid.data,
              }).select().single();
              if(fileRow.error) {
                await displayDialog({
                  title: "Unable to Save",
                  description: "An error occurred while saving file",
                });
                console.error(fileRow.error);
                return
              }

              const filename = `${fileRow.data.number}-1.docx`
              const res = await supabase.storage.from(msg.body.directory.project_id).upload(filename, docxBlob, {
                metadata: {
                  file_id: null,
                  directory_id: msg.body.directory.id,
                  filename: filename,
                }
              });

              if(res.error) {
                await displayDialog({
                  title: "Unable to Save",
                  description: "An error occurred while saving file",
                });
                console.error(res.error);
                return;
              }

              Office.context.document.settings.set(CONSTANTS.SETTINGS.FILE_REF, fileRow.data.number);
              Office.context.document.settings.set(CONSTANTS.SETTINGS.VERSION_REF, 1);
              await saveSettings();

              await launch(); // reload the doc

              return;

            case FileSelectorParentMessageTypes.CLOSE:
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