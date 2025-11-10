import { baseUrl } from "@workspace/word/lib/utils";
import { DialogMessageTypes } from "@workspace/word/surfaces/dialog/App";



type DisplayDialogProps = {
  title: string;
  description: string;
  onContinue?: () => Promise<void>;
  onClose?: () => Promise<void>;
}

type DisplayDialogFunc = (props: DisplayDialogProps) => void;

type DisplayDialog = DisplayDialogFunc & {
  Async: (props: Omit<DisplayDialogProps, "onContinue" | "onClose">) => Promise<boolean>;
}

const displayDialog: DisplayDialog = (props) => {

  const url = new URL(`${baseUrl}/src/surfaces/dialog/index.html`);
  url.searchParams.set("title", props.title);
  url.searchParams.set("desc", props.description);
  if (props.onContinue !== undefined) url.searchParams.set("allow-continue", "1");

  return Office.context.ui.displayDialogAsync(
    url.toString(),
    { height: 25, width: 25 },              // size in % of window
    (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {

        result.value.addEventHandler(Office.EventType.DialogEventReceived, async (arg) => {
          if ("error" in arg && arg.error === 12006) props.onClose && await props.onClose();
        });

        result.value.addEventHandler(Office.EventType.DialogMessageReceived, async (arg) => {
          if ("message" in arg) {
            switch (arg.message as DialogMessageTypes) {
              case "CONTINUE":
                result.value.close();
                props.onContinue && await props.onContinue();
                return;
              case "CLOSE":
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

};

displayDialog.Async = async (props) => await new Promise<boolean>((res) => displayDialog({
  ...props,
  onContinue: async () => res(true),
  onClose: async () => res(false)
}));

export { displayDialog };