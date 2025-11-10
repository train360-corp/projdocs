import { displayDialog } from "@workspace/word/surfaces/dialog/display";
import { statusCheck } from "@workspace/word/surfaces/ribbon/actions/launch";
import { _save } from "@workspace/word/surfaces/ribbon/actions/save";
import { CONSTANTS } from "@workspace/word/lib/consts";
import CloseBehavior = Word.CloseBehavior;
import { setButtons } from "@workspace/word/lib/utils";



export const checkIn: Action = async () => {

  const { connector: { loggedIn } } = await statusCheck();
  if (!loggedIn) return;

  const documentID: number | unknown = Office.context.document.settings.get(CONSTANTS.SETTINGS.FILE_REF);
  if (typeof documentID !== "number" || documentID <= 0) {
    displayDialog({
      title: "Unable to Check-In File",
      description: "File's number is (unexpectedly) empty!"
    });
    return;
  }

  // confirm before continuing
  const isContinuing = await displayDialog.Async({
    title: "Check-In Document?",
    description: "The current version will be saved and control returned to the server.",
  });
  if (!isContinuing) return;

  // ensure is saved once already
  const path = Office.context.document.url;
  if (!path.includes("/")) {
    displayDialog({
      title: "Unable to Check-In File",
      description: "File is (unexpectedly) not saved to disk!"
    });
    return;
  }

  // save the file
  if (!await _save()) return;

  // check-in the file
  const url = new URL(`${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/checkin`);
  url.searchParams.set("file-number", `${documentID}`);
  url.searchParams.set("doc-path", path)
  const success = await fetch(url.toString())
    .then(async (res) => {
      if(res.status !== 200) await res.json().then(console.error).catch(console.error);
      return res.status === 200;
    })
    .catch((err) => {
      console.error(err);
      return false;
    });
  if (success) await Word.run(async (context) => {
    context.document.close(CloseBehavior.skipSave); // no need to save again, it's already saved
    await context.sync();
  });
  else {
    displayDialog({
      title: "Unable to Check-In File",
      description: "An error occurred while trying to check-in the file."
    });
    return;
  }

};