import { CONSTANTS } from "@workspace/word/lib/consts";
import { saveSettings, setButtons } from "@workspace/word/lib/utils";
import { displayDialog } from "@workspace/word/lib/display-dialog";



export const launch: Action = async () => {
  const current = await Office.addin.getStartupBehavior();
  if (current !== Office.StartupBehavior.load) {
    await Office.addin.setStartupBehavior(Office.StartupBehavior.load);
    Office.context.document.settings.set(CONSTANTS.SETTINGS.AUTOLOAD, true);
    await saveSettings();
  }

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

  const status: Status = await fetch(`${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/user`)
    .then(async (resp) => ({
      connector: {
        running: true,
        loggedIn: resp.status === 200,
      }
    }) satisfies Status).catch(() => ({ connector: { running: false, loggedIn: false } } satisfies Status));


  if (!status.connector.running) {
    await displayDialog({
      title: "Unable to Connect to ProjDocs Connector",
      description: "Is the connector running on your device?"
    });
    await setButtons({
      [CONSTANTS.BUTTONS.LAUNCH.ID]: { enabled: true },
      [CONSTANTS.BUTTONS.SAVE.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID]: { enabled: false },
    });
  } else if (!status.connector.loggedIn) {
    await displayDialog({
      title: "Not Logged In",
      description: "The ProjDocs Connector is running on your device, but is not logged in.",
    });
    await setButtons({
      [CONSTANTS.BUTTONS.LAUNCH.ID]: { enabled: true },
      [CONSTANTS.BUTTONS.SAVE.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_VERSION.ID]: { enabled: false },
      [CONSTANTS.BUTTONS.SAVE_AS_NEW_DOCUMENT.ID]: { enabled: false },
    });
  } else if (typeof documentID === "number" && documentID > 0) await setButtons({
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
};

type Status = {
  connector: {
    running: boolean;
    loggedIn: boolean;
  }
}

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