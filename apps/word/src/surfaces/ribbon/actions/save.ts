import { CONSTANTS } from "@workspace/word/lib/consts";
import { blobToDataUri, getFileBlob, saveSettings } from "@workspace/word/lib/utils";
import { createClient } from "@workspace/supabase/client";
import { refreshFileIdContentControls } from "@workspace/word/lib/content-controls";
import { displayDialog } from "@workspace/word/surfaces/dialog/display";
import { Tables } from "@workspace/supabase/types.gen";
import { v4 } from "uuid";



export const _save = async (): Promise<boolean> => {

  // save file locally
  await Word.run(async (context) => {
    context.document.save(Word.SaveBehavior.save);
    await context.sync();
  });

  const supabase = createClient();

  // ensure start-up behavior is correct
  if (await Office.addin.getStartupBehavior() !== Office.StartupBehavior.load) {
    await Office.addin.setStartupBehavior(Office.StartupBehavior.load);
    Office.context.document.settings.set(CONSTANTS.SETTINGS.AUTOLOAD, true);
    await saveSettings();
  }

  // refresh fields before save
  await refreshFileIdContentControls();

  const curFileNum: number | unknown = Office.context.document.settings.get(CONSTANTS.SETTINGS.FILE_REF);
  if (typeof curFileNum !== "number" || curFileNum < 0) {
    displayDialog({
      title: "Unable to Save",
      description: "File reference number is unexpectedly empty!",
    });
    return false;
  }

  const curVerNum: number | unknown = Office.context.document.settings.get(CONSTANTS.SETTINGS.VERSION_REF);
  if (typeof curVerNum !== "number" || curVerNum < 0) {
    displayDialog({
      title: "Unable to Save",
      description: "Version reference number is unexpectedly empty!",
    });
    return false;
  }

  // load the file
  const file = await supabase.from("files").select("*, version:current_version_id (*)").eq("number", curFileNum).single().overrideTypes<Tables<"files"> & {
    version: Tables<"files_versions"> | null
  }>();
  if (file.error) {
    console.error(file.error);
    displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return false;
  }
  if (file.data.version === null) {
    displayDialog({
      title: "Unable to Save",
      description: "This file does not have a current version",
    });
    return false;
  }

  // load the version
  const version = await supabase.from("files_versions").select().eq("file_id", file.data.id).eq("version", curVerNum).single();
  if(version.error) {
    displayDialog({
      title: "Unable to Save",
      description: "An error occurred while loading the underlying version data",
    });
    return false;
  }

  // load the storage object
  const object = await supabase.rpc("get_storage_object_by_id", { object_id: file.data.version.object_id });
  if (object.error) {
    console.error(object.error);
    displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return false;
  }
  if (object.data.path_tokens === null) {
    console.error("no path tokens!");
    displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return false;
  }

  // get doc contents
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
    displayDialog({
      title: "Unable to Save",
      description: "An error occurred while saving file",
    });
    return false;
  }

  const res = await supabase.storage.from(file.data.project_id).upload(
    v4(), // use random name for the physical storage.objects row to avoid duplicate-name conflicts
    docxBlob,
    {
      metadata: {
        // @ts-expect-error
        ...object.data.user_metadata,
        version_id: version.data.id,
        preview: (await blobToDataUri(previewBlob)) satisfies string,
      }
    });

  console.log(res);

  if (res.error) {
    console.error(res.error);
    displayDialog({
      title: "Unable to Save",
      description: "File was saved locally, but not to ProjDocs!",
    });
    return false;
  }

  return true;
};

export const save: Action = async () => {
  await _save();
};
