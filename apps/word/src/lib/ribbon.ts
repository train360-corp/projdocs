import { Actions } from "@workspace/word/lib/actions";
import { CONSTANTS } from "@workspace/word/lib/consts";



const safely = (action: () => Promise<void>) => (
  async (event: Office.AddinCommands.Event) => {
    try {
      await action();
    } catch (error) {
      console.error(error);
    } finally {
      event.completed();
    }
  }
);

export const Ribbon = {
  setup: async () => {
    Office.actions.associate(CONSTANTS.BUTTONS.LAUNCH.FUNC_ID, safely(Actions.launch));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE.FUNC_ID, safely(Actions.save));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.FUNC_ID, safely(Actions.saveAsNewVersion));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.FUNC_ID, safely(Actions.saveAsNewFile));
    Office.actions.associate(CONSTANTS.BUTTONS.INSERT.FUNC_ID, safely(Actions.insertDocumentNumber));
    await Actions.launch();
  }
};
