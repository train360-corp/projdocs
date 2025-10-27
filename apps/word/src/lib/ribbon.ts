import { setButtons } from "@workspace/word/lib/utils";
import { Actions } from "@workspace/word/lib/actions";
import { CONSTANTS } from "@workspace/word/lib/consts";



type EventHandler = (event: Office.AddinCommands.Event) => Promise<void>;

const safely = (action: Action): EventHandler => async (event) => {
  try {
    await action();
  } catch (e) {
    console.error(e);
  } finally {
    event.completed();
  }
};

export const Ribbon = {

  setup: async () => {
    Office.actions.associate(CONSTANTS.BUTTONS.LAUNCH.FUNC_ID, safely(Actions.launch));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE.FUNC_ID, safely(Actions.save));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.FUNC_ID, safely(Actions.saveAsNewVersion));
    Office.actions.associate(CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.FUNC_ID, safely(Actions.saveAsNewFile));

    // wait for ribbon to initialize
    await waitForRibbon();

    // always disable everything briefly while we determine state (prevents flicker)
    await setButtons({
      [CONSTANTS.BUTTONS.LAUNCH.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID]: { enabled: false },
    });

    const documentID = Office.context.document.settings.get(CONSTANTS.SETTINGS.FILE_REF);

    console.log(documentID && typeof documentID);
    console.log(Office.context.document.settings);

    const loggedIn = await fetch(`${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/user`).then(async (resp) => {
      if (resp.status !== 200) return;
      const obj = await resp.json();
      return typeof obj === "object" && "token" in obj && obj.token;
    }).catch(() => false);

    if (!loggedIn) await setButtons({
      [CONSTANTS.BUTTONS.LAUNCH.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID]: { enabled: false },
    });
    // Document already registered with backend
    else if (typeof documentID === "number" && documentID > 0) await setButtons({
      [CONSTANTS.BUTTONS.LAUNCH.ID]: { enabled: false }, // hide/disable launcher once bootstrapped
      [CONSTANTS.BUTTONS.SAVE.ID]: { enabled: true },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID]: { enabled: true },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID]: { enabled: true },
    });
    else await setButtons({
        [CONSTANTS.BUTTONS.LAUNCH.ID]: { enabled: false }, // launcher pressed or autoloaded; keep disabled
        [CONSTANTS.BUTTONS.SAVE.ID]: { enabled: false },
        [CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID]: { enabled: false },
        [CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID]: { enabled: true },
      });
  }
};

async function waitForRibbon(maxTries = 10, delayMs = 300) {
  for (let i = 0; i < maxTries; i++) {
    try { // try a no-op request to see if Ribbon is ready
      await Office.ribbon.requestUpdate({ tabs: [] });
      return; // success → ribbon ready
    } catch {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.warn("Ribbon never became ready; continuing anyway");
}