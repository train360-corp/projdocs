import { CONSTANTS } from "@workspace/word/lib/consts";



export const refreshFileIdContentControls = async () => await Word.run(async (context) => {

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

  // get all controls
  const contentControls = context.document.contentControls;
  contentControls.load('id'); // Queue a command to load the id property for all of the content controls.
  // Synchronize the document state by executing the queued commands,
  // and return a promise to indicate task completion.
  await context.sync();
  if (contentControls.items.length === 0) {
    return;
  }


  contentControls.items.forEach((item) => item.load("tag"))
  await context.sync();



  // filter to only tagged controls
  const projdocsControls = contentControls.items.filter((cc) => cc.tag === CONSTANTS.CONTENT_CONTROLS.FILE_ID.TAG);
  for (const cc of projdocsControls) {
    cc.cannotEdit = false;
    cc.insertText(`${fileRef}.${verRef}`, "Replace");
  }
  await context.sync();
  for (const cc of projdocsControls) cc.cannotEdit = true;
  await context.sync();

}).catch(console.error);