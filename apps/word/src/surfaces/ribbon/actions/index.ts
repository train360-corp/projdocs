import { save } from "@workspace/word/surfaces/ribbon/actions/save";
import { saveAsNewVersion } from "@workspace/word/surfaces/ribbon/actions/save-as-new-version";
import { launch } from "@workspace/word/surfaces/ribbon/actions/launch";
import { saveAsNewFile } from "@workspace/word/surfaces/ribbon/actions/save-as-new-document";
import { CONSTANTS } from "@workspace/word/lib/consts";
import { insertDocumentNumber } from "@workspace/word/surfaces/ribbon/actions/insert-doc-id-number";
import { checkIn } from "@workspace/word/surfaces/ribbon/actions/check-in";



export const Ribbon = {
  setup: async () => {
    Office.actions.associate(CONSTANTS.BUTTONS.CHECK_IN.FUNC_ID, safely(checkIn));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE.FUNC_ID, safely(save));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.FUNC_ID, safely(saveAsNewVersion));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.FUNC_ID, safely(saveAsNewFile));
    Office.actions.associate(CONSTANTS.BUTTONS.INSERT.FUNC_ID, safely(insertDocumentNumber));
    await launch();
  }
};

const safely = (action: Action) => (
  async (event: Office.AddinCommands.Event) => {
    try {
      await action();
    } catch (error) {
      console.error(`an error occurred running ${action.name}:`, error);
    } finally {
      event.completed();
    }
  }
);