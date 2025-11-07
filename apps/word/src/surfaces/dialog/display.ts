import { baseUrl } from "@workspace/word/lib/utils";



export const displayDialog = async (props: {
  title: string;
  description: string;
  onClose?: () => Promise<void>;
}) => {

  const url = new URL(`${baseUrl}/src/surfaces/dialog/index.html`);
  url.searchParams.set("title", props.title);
  url.searchParams.set("desc", props.description);

  return Office.context.ui.displayDialogAsync(
    url.toString(),
    { height: 25, width: 25 },              // size in % of window
    (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {

        result.value.addEventHandler(Office.EventType.DialogEventReceived, async (arg) => {
         if("error" in arg && arg.error === 12006) props.onClose && await props.onClose();
        });

        result.value.addEventHandler(Office.EventType.DialogMessageReceived, async (arg) => {
          if ("message" in arg) {
            switch (arg.message) {
              case "close":
                result.value.close();
                props.onClose && await props.onClose();
                return;
              default:
                console.warn(`dialog message type "${arg.message}" is unhandled`);
            }
          } else console.error(arg.error);
        });
      } else {
        console.error("Failed to open dialog:", result.error);
      }
    }
  );

}