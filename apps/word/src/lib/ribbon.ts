import { setButtons } from "@workspace/word/lib/utils";
import { Actions } from "@workspace/word/lib/actions";
import { CONSTANTS } from "@workspace/word/lib/consts";



export const Ribbon = {

  setup: async () => {
    Office.actions.associate("launchProjDocs", Actions.launch);
    Office.actions.associate("save", Actions.save);
    Office.actions.associate("saveAsNewVersion", Actions.saveAsNewVersion);
    Office.actions.associate("saveAsNewFile", Actions.saveAsNewFile);

    // wait for ribbon to initialize
    await waitForRibbon();

    // always disable everything briefly while we determine state (prevents flicker)
    await setButtons({
      [CONSTANTS.BUTTONS.LAUNCH.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID]: { enabled: false },
    });

    const documentID = Office.context.document.settings.get(CONSTANTS.SETTINGS.REF);

    // Document already registered with backend
    if (typeof documentID === "string" && documentID.length > 0) await setButtons({
      [CONSTANTS.BUTTONS.LAUNCH.ID]: { enabled: false }, // hide/disable launcher once bootstrapped
      [CONSTANTS.BUTTONS.SAVE.ID]: { enabled: true },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID]: { enabled: true },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID]: { enabled: false },
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