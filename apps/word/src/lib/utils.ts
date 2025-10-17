export function saveSettings(): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.document.settings.saveAsync((res) => {
      if (res.status === Office.AsyncResultStatus.Succeeded) resolve();
      else reject(res.error);
    });
  });
}

export const setButtons = async (map: Record<string, Omit<Office.Control, "id">>) =>
  await Office.ribbon.requestUpdate({
    tabs: [
      {
        id: "TabHome",
        groups: [
          {
            id: "CommandsGroup",
            controls: Object.entries(map).map(([ id, control ]) => ({
              id,
              enabled: control.enabled,
            }) as Office.Control),
          },
        ],
      },
    ],
  });