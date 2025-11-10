import React, { ReactNode, useState } from "react";
import { Tables } from "@workspace/supabase/types.gen";
import { FileBrowserEventTypes, useFileBrowserEvent } from "@workspace/web/components/file-browser-table";
import { Card, CardContent } from "@workspace/ui/components/card";
import { IconFolder } from "@tabler/icons-react";
import { P } from "@workspace/ui/components/text";
import { Button } from "@workspace/ui/components/button";
import {
  FileSelectorParentMessage,
  FileSelectorParentMessageTypes
} from "@workspace/word/surfaces/ribbon/actions/save-as-new-document";
import { Input } from "@workspace/ui/components/input";
import { CONSTANTS } from "@workspace/word/lib/consts";



export const DirectoryWrapper = ({ children }: {
  children: ReactNode;
}) => {

  const [ directory, setDirectory ] = useState<Tables<"directories"> | null>(null);
  const [ filename, setFilename ] = useState<string>(window.filename ?? "");
  const filenameIsValid = CONSTANTS.VALIDATORS.FILENAME.test(filename);

  useFileBrowserEvent(FileBrowserEventTypes.DIRECTORY_SELECTED, ({ directory }) => setDirectory(directory));

  return (
    <div className={"w-full h-full flex flex-col"}>
      {children}
      {directory !== null && (
        <div className={"flex flex-row w-full h-fit"}>
          <Card className={"w-full mx-6 mb-8 p-2"}>

            <CardContent className={"flex flex-row items-end justify-between px-0 pl-0"}>
              <div className={"flex flex-col"}>
                <P className={"text-muted-foreground"}>{"Save To"}</P>
                <div className={"flex flex-row items-center gap-2"}>
                  <IconFolder/>
                  <P className={"font-bold"}>{directory.name}</P>
                  <P>{"/"}</P>
                  <Input
                    value={filename}
                    className={"pr-12"}
                    suffix={".docx"}
                    placeholder={"filename"}
                    onChange={(e) => {
                      window.filename = e.target.value;
                      setFilename(e.target.value)
                    }}
                  />
                </div>
              </div>
              <Button
                disabled={!filenameIsValid}
                onClick={() => Office.context.ui.messageParent(JSON.stringify({
                  type: FileSelectorParentMessageTypes.SAVE,
                  body: {
                    directory: directory,
                    filename: filename,
                  }
                } satisfies FileSelectorParentMessage))}
              >
                {"Save"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};