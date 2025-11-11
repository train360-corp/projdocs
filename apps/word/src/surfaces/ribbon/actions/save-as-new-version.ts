import { blobToDataUri, getFileBlob, pathSeparator, saveSettings } from "@workspace/word/lib/utils";
import { CONSTANTS } from "@workspace/word/lib/consts";
import { createClient } from "@workspace/supabase/client";
import { refreshFileIdContentControls } from "@workspace/word/lib/content-controls";
import { displayDialog } from "@workspace/word/surfaces/dialog/display";
import { Tables } from "@workspace/supabase/types.gen";
import { statusCheck } from "@workspace/word/surfaces/ribbon/actions/launch";
import { v4 } from "uuid";



export const saveAsNewVersion: Action = async () => {

  // ensure start-up behavior is correct
  if (await Office.addin.getStartupBehavior() !== Office.StartupBehavior.load) {
    await Office.addin.setStartupBehavior(Office.StartupBehavior.load);
    Office.context.document.settings.set(CONSTANTS.SETTINGS.AUTOLOAD, true);
    await saveSettings();
  }

  // status check
  const { connector: { loggedIn } } = await statusCheck();
  if (!loggedIn) return;

  const docPath = Office.context.document.url;
  let baseFileName = docPath.includes(pathSeparator)
    ? docPath.split(pathSeparator).pop()!
    : "NewDocument";
  if (baseFileName.toLowerCase().endsWith(".docx")) baseFileName = baseFileName.substring(0, baseFileName.length - (".docx").length);
  baseFileName = baseFileName.replace(/-\d+\.\d+$/, ""); // matches: "-{number}.{number}" at the very end of the string

  const curFileNum: number | unknown = Office.context.document.settings.get(CONSTANTS.SETTINGS.FILE_REF);
  if (typeof curFileNum !== "number" || curFileNum < 0) {
    displayDialog({
      title: "Unable to Save",
      description: "File reference number is unexpectedly empty!",
    });
    return;
  }

  const curVerNum: number | unknown = Office.context.document.settings.get(CONSTANTS.SETTINGS.VERSION_REF);
  if (typeof curVerNum !== "number" || curVerNum < 0) {
    displayDialog({
      title: "Unable to Save",
      description: "Version reference number is unexpectedly empty!",
    });
    return;
  }

  try {
    const supabase = createClient();

    // load the file
    const file = await supabase.from("files").select("*, version:current_version_id (*)").eq("number", curFileNum).single().overrideTypes<Tables<"files"> & {
      version: Tables<"files_versions"> | null
    }>();
    if (file.error) throw new Error(`unable to load file: ${file.error}`);
    if (!file.data.version) throw new Error("file is missing current version");


    // try to update version number
    Office.context.document.settings.set(CONSTANTS.SETTINGS.VERSION_REF, file.data.version.version + 1);
    await saveSettings();
    await refreshFileIdContentControls();

    // get the blob
    const { blob } = await getFileBlob();
    const { blob: previewBlob } = await getFileBlob(Office.FileType.Pdf);

    // revert version in THIS document
    Office.context.document.settings.set(CONSTANTS.SETTINGS.VERSION_REF, curVerNum);
    await saveSettings();
    await refreshFileIdContentControls();

    // upload the blob
    const res = await supabase.storage.from(file.data.project_id).upload(
      v4(), // use random name for the physical storage.objects row to avoid duplicate-name conflicts
      blob,
      {
        metadata: {
          file_id: file.data.id,
          directory_id: null,
          version_id: null,
          filename: baseFileName.toLowerCase().endsWith(".docx") ? baseFileName : `${baseFileName}.docx`,
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
    const url = new URL(`${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/checkout`);
    url.searchParams.set("file-id", file.data.id);
    url.searchParams.set("remove", docPath);
    const checkout = await fetch(url.toString());
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


  } catch (e) {
    console.error(e);
    displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving version",
    });
  } finally {
    Office.context.document.settings.set(CONSTANTS.SETTINGS.FILE_REF, curFileNum);
    Office.context.document.settings.set(CONSTANTS.SETTINGS.VERSION_REF, curVerNum);
    await refreshFileIdContentControls();
    await saveSettings();
  }

};