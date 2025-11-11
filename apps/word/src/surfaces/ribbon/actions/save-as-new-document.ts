import { baseUrl, blobToDataUri, getFileBlob, pathSeparator, saveSettings } from "@workspace/word/lib/utils";
import { Tables } from "@workspace/supabase/types.gen";
import { createClient } from "@workspace/supabase/client";
import { displayDialog } from "@workspace/word/surfaces/dialog/display";
import { CONSTANTS } from "@workspace/word/lib/consts";
import { refreshFileIdContentControls } from "@workspace/word/lib/content-controls";
import { v4 } from "uuid";



export enum FileSelectorParentMessageTypes {
  CLOSE = "office:file-selector:close",
  SAVE = "office:file-selector:save",
}

export type FileSelectorParentMessage =
  | { type: FileSelectorParentMessageTypes.CLOSE; body: {} }
  | { type: FileSelectorParentMessageTypes.SAVE; body: { directory: Tables<"directories">; filename: string; } };

export const saveAsNewFile: Action = async () => {

  // ensure start-up behavior is correct
  if (await Office.addin.getStartupBehavior() !== Office.StartupBehavior.load) {
    await Office.addin.setStartupBehavior(Office.StartupBehavior.load);
    Office.context.document.settings.set(CONSTANTS.SETTINGS.AUTOLOAD, true);
    await saveSettings();
  }

  let baseFileName = Office.context.document.url.includes(pathSeparator)
    ? Office.context.document.url.split(pathSeparator).pop()!
    : "NewDocument";
  if (baseFileName.toLowerCase().endsWith(".docx")) baseFileName = baseFileName.substring(0, baseFileName.length - (".docx").length);
  baseFileName = baseFileName.replace(/-\d+\.\d+$/, ""); // matches: "-{number}.{number}" at the very end of the string

  // open the folder picker
  const url = new URL(`${baseUrl}/src/surfaces/folder-picker/index.html`);
  url.searchParams.set("filename", baseFileName);
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

            // save-event
            case FileSelectorParentMessageTypes.SAVE:

              // close the dialog
              result.value.close();

              // use user-specified base filename
              baseFileName = msg.body.filename;

              const supabase = createClient();
              const uid = await supabase.rpc("get_user_id");
              if (uid.error || !uid.data) {
                displayDialog({
                  title: "Unable to Save",
                  description: "An error occurred while saving file",
                });
                console.error(uid.error ?? "no session returned");
                return;
              }

              const fileRow = await supabase.from("files").insert({
                project_id: msg.body.directory.project_id,
                locked_by_user_id: uid.data,
              }).select().single();
              if (fileRow.error) {
                displayDialog({
                  title: "Unable to Save",
                  description: "An error occurred while saving file",
                });
                console.error(fileRow.error);
                return;
              }

              Office.context.document.settings.set(CONSTANTS.SETTINGS.FILE_REF, fileRow.data.number);
              Office.context.document.settings.set(CONSTANTS.SETTINGS.VERSION_REF, 1);
              await saveSettings();

              await refreshFileIdContentControls();

              let docxBlob: Blob;
              let previewBlob: Blob;
              try {
                // document itself
                const { blob: dBlob } = await getFileBlob();
                docxBlob = dBlob;

                // preview
                const { blob: pBlob } = await getFileBlob(Office.FileType.Pdf);
                previewBlob = pBlob;
              } catch (e) {
                console.error(e);
                Office.context.document.settings.remove(CONSTANTS.SETTINGS.FILE_REF);
                Office.context.document.settings.remove(CONSTANTS.SETTINGS.VERSION_REF);
                await saveSettings();
                displayDialog({
                  title: "Unable to Save",
                  description: "An error occurred while saving file",
                });
                return;
              }

              // remove from THIS document (already in the blob/static document)
              Office.context.document.settings.remove(CONSTANTS.SETTINGS.FILE_REF);
              Office.context.document.settings.remove(CONSTANTS.SETTINGS.VERSION_REF);
              await saveSettings();

              const filename = baseFileName.toLowerCase().endsWith(".docx") ? baseFileName : `${baseFileName}.docx`;
              const res = await supabase.storage.from(msg.body.directory.project_id).upload(
                v4(), // use random name for the physical storage.objects row to avoid duplicate-name conflicts
                docxBlob, {
                  metadata: {
                    file_id: fileRow.data.id,
                    directory_id: msg.body.directory.id,
                    version_id: null,
                    filename: filename,
                    preview: (await blobToDataUri(previewBlob)) satisfies string,
                  }
                });

              if (res.error) {
                displayDialog({
                  title: "Unable to Save",
                  description: "An error occurred while saving file",
                });
                console.error(res.error);
                return;
              }

              // checkout the file
              const checkout = await fetch(`${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/checkout?file-id=${fileRow.data.id}`);
              if (checkout.status !== 201) {
                try {
                  console.error(await checkout.json());
                } catch (e) {
                  console.error("unable to log error:", e);
                }
                displayDialog({
                  title: "Unable to Checkout File",
                  description: `File saved successfully, but an error occurred while opening it (${checkout.status})`,
                  onClose: async () => await Word.run(async (context) => {
                    context.document.close(Word.CloseBehavior.skipSave);
                    await context.sync();
                  })
                });
                return;
              }

              try {
                const { path } = await checkout.json();

                // save and re-open
                await Word.run(async (context) => {
                  context.application.openDocument(path);
                  await context.sync();
                  context.document.close(Word.CloseBehavior.skipSave);
                  await context.sync();
                });

              } catch (e) {
                console.error(e);
                displayDialog({
                  title: "Unable to Checkout File",
                  description: "File saved successfully, but an error occurred while opening it",
                  onClose: async () => await Word.run(async (context) => {
                    context.document.close(Word.CloseBehavior.skipSave);
                    await context.sync();
                  })
                });
                return;
              }

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
};




