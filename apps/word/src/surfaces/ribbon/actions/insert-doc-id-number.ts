import { refreshFileIdContentControls } from "@workspace/word/lib/content-controls";
import { CONSTANTS } from "@workspace/word/lib/consts";



export const insertDocumentNumber: Action = async () => await Word.run(async (context) => {

  // refresh existing ids
  await refreshFileIdContentControls();

  const fileRef = Office.context.document.settings.get(CONSTANTS.SETTINGS.FILE_REF);
  const verRef = Office.context.document.settings.get(CONSTANTS.SETTINGS.VERSION_REF);
  if (!fileRef) {
    console.warn("FILE_REF not set in Office.context.document.settings");
    return;
  }
  if (!verRef) {
    console.warn("VERSION_REF not set in Office.context.document.settings");
    return;
  }
  const range = context.document.getSelection();
  range.clear();
  const cc = range.insertContentControl();
  cc.title = "ProjDocs File Reference";
  cc.tag = CONSTANTS.CONTENT_CONTROLS.FILE_ID.TAG;
  cc.insertText(`${fileRef}.${verRef}`, "Replace");
  cc.appearance = "BoundingBox";
  cc.cannotEdit = true;
  await context.sync();
})