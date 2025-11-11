"use client";

import { useEffect, useState } from "react";
import { createClient } from "@workspace/supabase/client";
import { FileViewers } from "@workspace/web/components/file-viewer/viewers";
import { Card } from "@workspace/ui/components/card";
import { NIL } from "uuid";
import { Tables } from "@workspace/supabase/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@workspace/ui/components/select";
import { useRealtimeRows } from "@workspace/web/hooks/use-realtime-rows";
import { Badge } from "@workspace/ui/components/badge";
import { H4, P } from "@workspace/ui/components/text";
import { Separator } from "@workspace/ui/components/separator";
import { Button } from "@workspace/ui/components/button";
import { IconDownload, IconFolderPlus, IconLink, IconSend } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { DropzoneWrapper } from "@workspace/ui/components/dropzone-wrapper";
import { toast } from "sonner";
import { uploadFile } from "@workspace/web/lib/supabase/upload-file";



type State = {
  isLoading: true;
  version: undefined;
  data: undefined;
} | {
  isLoading: false;
  version: null;
  data: undefined;
} | {
  isLoading: true;
  version: Tables<"files_versions">;
  data: undefined;
} | {
  isLoading: false;
  version: Tables<"files_versions">;
  data: null;
} | {
  isLoading: false;
  version: Tables<"files_versions">;
  data: {
    info: Tables<{ schema: "storage" }, "objects">,
    blob: Blob
  };
}

export const FileViewer = (props: {
  file: Tables<"files">;
  project: Tables<"projects">;
  directory: Tables<"directories">;
}) => {

  const [ state, setState ] = useState<State>({
    isLoading: true,
    version: undefined,
    data: undefined
  });

  const versions = useRealtimeRows({
    table: "files_versions",
    filters: [
      {
        column: "file_id",
        value: props.file.id
      }
    ]
  });

  // handle version change
  useEffect(() => {
    (async () => {

      const supabase = createClient();

      let versionQuery = supabase.from("files_versions").select().eq("file_id", props.file.id);
      if (state.version !== undefined && state.version !== null) versionQuery = versionQuery.eq("version", state.version.version);
      else versionQuery = versionQuery.eq("id", props.file.current_version_id ?? NIL);
      const { data: version } = await versionQuery.single();

      if (!version) {
        setState({ version: null, data: undefined, isLoading: false });
        return;
      }

      const { data: object } = await supabase.rpc("get_storage_object_by_id", { object_id: version.object_id });
      if (!object) {
        setState({ version, data: null, isLoading: false });
        return;
      }

      const { data } = await supabase.storage.from(object.bucket_id!).download(`/${object.name}`);
      setState({ version, data: data === null ? null : { info: object, blob: data }, isLoading: false });
    })();
  }, [ state.version?.version ]);

  const className = "h-full w-full overflow-auto flex flex-col flex-col-reverse gap-4 lg:flex-row lg:gap-6";

  if (state.data === null || state.data === undefined || versions.rows === undefined) return (
    <div className={className}>
      <Skeleton className={"w-[66%] max-w-[66%] h-full rounded-xl"}/>
      <Skeleton className={"w-[33%] max-w-[33%] h-full rounded-xl"}/>
    </div>
  );

  return (
    <DropzoneWrapper
      overlay={(
        <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center pointer-events-none">
          <p className="text-white text-lg font-semibold">{"Upload new version"}</p>
        </div>
      )}
      onDrop={async (files) => {
        if (files.length !== 1) toast.error(`${files.length} Files Dropped!`, {
          description: "Upload only a single file."
        });

        const supabase = createClient();
        const file = files[0]!;

        // @ts-ignore
        if (file.type !== state.data?.info.metadata!.mimetype) {
          toast.error("Type Mismatch!", {
            // @ts-ignore
            description: `File is ${state.data?.info.metadata!.mimetype} but uploaded file is ${file.type}.`
          });
          return;
        }

        await uploadFile(supabase, {
          file: {
            type: "file",
            data: file,
            object: props.file
          },
          directory: props.directory,
          onError: error => {
            if ("originalResponse" in error && error.originalResponse?.getStatus() === 403) toast.error("Permission Denied", {
              description: "You do not have permission to upload to this project."
            });
            else toast.error("Request Failed", {
              description: "An unknown error occurred."
            });
          },
        });

      }}
    >
      <div className={className}>
        {/* VIEWER */}
        <Card className={"py-0 w-full max-w-full lg:w-[66%] lg:max-w-[66%]"}>
          <FileViewers
            data={state.data}
            version={state.version}
            file={props.file}
          />
        </Card>

        {/* SIDEBAR */}
        <Card className={"p-4 h-fit w-full max-w-full lg:w-[33%] lg:max-w-[33%]"}>


          <div className="flex flex-col gap-1">
            <Badge variant={"secondary"} className="h-5 min-w-5 rounded-full px-2 font-mono tabular-nums">
              {`File No. ${props.file.number}`}
            </Badge>

            <H4 className={"max-w-full truncate"}>{state.version.name}</H4>
          </div>

          <div className={"flex flex-col w-full gap-1"}>
            <P className={"text-xs"}>{"Viewing Version"}</P>
            <Select
              value={state.version.id}
              onValueChange={(versionID) => setState({
                version: versions.rows?.find((v) => v.id === versionID),
                data: undefined,
                isLoading: true
              })}
            >
              <SelectTrigger className={"w-full"}>
                <SelectValue placeholder="Select a version"/>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{"Versions"}</SelectLabel>
                  {[...(versions.rows ?? [])].sort((a, b) => b.version - a.version).map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      <div className="w-full flex flex-row items-center gap-2 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className="h-5 min-w-5 shrink-0 rounded-full px-1 font-mono tabular-nums"
                        >
                          {version.version}
                        </Badge>

                        {/* Name text grows and truncates */}
                        {version.name.trim() ? (
                          <P className="flex-1 truncate">{version.name.trim()}</P>
                        ) : (
                          <P className="flex-1 text-muted truncate">Unnamed version</P>
                        )}

                        {version.id === (props.file.current_version_id ?? NIL) && (
                          <Badge
                            variant="default"
                            className="h-5 min-w-5 shrink-0 rounded-full px-1 font-mono tabular-nums"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Separator orientation={"horizontal"}/>

          <div className={"flex flex-row gap-4 w-full justify-center"}>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={URL.createObjectURL(state.data.blob)}
                  download={`${state.version.name.trim().replace(/\.[^/.]+$/, "")} (${props.file.number}.${state.version.version}).${state.version.name.trim().split(".").pop()!}`}
                >
                  <Button variant={"outline"} size={"icon"}>
                    <IconDownload size={8}/>
                  </Button>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <P>{"Download"}</P>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled variant={"outline"} size={"icon"}>
                  <IconLink size={8}/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <P>{"Copy Link"}</P>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled variant={"outline"} size={"icon"}>
                  <IconFolderPlus size={8}/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <P>{"Add to Folder"}</P>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled variant={"outline"} size={"icon"}>
                  <IconSend size={8}/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <P>{"Send a Copy"}</P>
              </TooltipContent>
            </Tooltip>

          </div>
        </Card>

      </div>
    </DropzoneWrapper>
  );
};