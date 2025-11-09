import { CONSTANTS } from "@workspace/word/lib/consts";
import { FileBlob, getFileBlob, saveSettings, setButtons } from "@workspace/word/lib/utils";
import { createClient } from "@workspace/supabase/client";
import { refreshFileIdContentControls } from "@workspace/word/lib/content-controls";
import { displayDialog } from "@workspace/word/surfaces/dialog/display";
import { Tables } from "@workspace/supabase/types.gen";
import SaveBehavior = Word.SaveBehavior;



export const save: Action = async () => {

  // save file locally
  await Word.run(async (context) => {
    context.document.save(SaveBehavior.save);
    await context.sync();
  })

  const supabase = createClient();

  // ensure start-up behavior is correct
  if (await Office.addin.getStartupBehavior() !== Office.StartupBehavior.load) {
    await Office.addin.setStartupBehavior(Office.StartupBehavior.load);
    Office.context.document.settings.set(CONSTANTS.SETTINGS.AUTOLOAD, true);
    await saveSettings();
  }

  // refresh fields before save
  await refreshFileIdContentControls();

  const fileRef: number | unknown = Office.context.document.settings.get(CONSTANTS.SETTINGS.FILE_REF);
  if (!fileRef || typeof fileRef !== "number") {
    console.error("fileRef is falsey");
    await displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return;
  }

  // load the file
  const file = await supabase.from("files").select("*, version:current_version_id (*)").eq("number", fileRef).single().overrideTypes<Tables<"files"> & {
    version: Tables<"files_versions"> | null
  }>();
  if (file.error) {
    console.error(file.error);
    await displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return;
  }
  if (file.data.version === null) {
    await displayDialog({
      title: "Unable to Save",
      description: "This file does not have a current version",
    });
    return;
  }

  // load the storage object
  const object = await supabase.rpc("get_storage_object_by_id", { object_id: file.data.version.object_id });
  if (object.error) {
    console.error(object.error);
    await displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return;
  }
  if(object.data.path_tokens === null) {
    console.error("no path tokens!");
    await displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return;
  }

  // get doc contents
  let blob: FileBlob;
  try {
    blob = await getFileBlob();
  } catch (e) {
    console.error(e);
    await displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return;
  }

  const res = await supabase.storage.from(file.data.project_id).update(
    object.data.path_tokens.join("/"),
    blob.blob,
    {
      // @ts-expect-error
      metadata: object.data.user_metadata,
      upsert: true,
    }
  );

  if(res.error) {
    console.error(res.error);
    await displayDialog({
      title: "Unable to Save",
      description: "File was saved locally, but not to ProjDocs!",
    });
    return;
  }

  Office.context.document.settings.set(CONSTANTS.SETTINGS.LAST_SAVE_HASH, blob.hash);
  await saveSettings()

};
