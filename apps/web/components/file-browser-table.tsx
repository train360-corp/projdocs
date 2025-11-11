import { SupabaseClient, Tables } from "@workspace/supabase/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { columns } from "@workspace/web/components/file-browser-directory-columns";
import { IconDotsVertical, IconFolder } from "@tabler/icons-react";
import * as React from "react";
import { Dispatch, MouseEventHandler, ReactElement, SetStateAction, useEffect, useRef, useState } from "react";
import { Loader } from "lucide-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";
import { DefaultExtensionType, defaultStyles, FileIcon } from "react-file-icon";
import * as mime from "react-native-mime-types";
import { useRealtimeListener } from "@workspace/supabase/realtime/subscriber";
import { cn } from "@workspace/ui/lib/utils";

export const FILE_BROWSER_EVENTS_CHANNEL = "file-browser"

export enum FileBrowserEventTypes {
  DIRECTORY_SELECTED = "file-browser:directory:selected",
  FILE_SELECTED = "file-browser:file:selected",
  UNKNOWN = "file-browser:unknown",
}

export type FileBrowserEventPayload<T extends FileBrowserEventTypes> = T extends FileBrowserEventTypes.DIRECTORY_SELECTED ? {
  type: FileBrowserEventTypes.DIRECTORY_SELECTED;
  directory: Tables<"directories">;
} : T extends FileBrowserEventTypes.FILE_SELECTED ? {
  type: FileBrowserEventTypes.FILE_SELECTED;
  file: Tables<"symlinks">;
} : {
  type: FileBrowserEventTypes.UNKNOWN;
}

export const useFileBrowserEvent = <T extends FileBrowserEventTypes>(event: T, handler: (payload: FileBrowserEventPayload<T>) => void) => {
  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<FileBrowserEventPayload<T>>).detail;
      if(detail.type === event) handler(detail);
    };
    window.addEventListener(FILE_BROWSER_EVENTS_CHANNEL, listener);
    return () => window.removeEventListener(FILE_BROWSER_EVENTS_CHANNEL, listener);
  }, [ event, handler ]);
}

const dispatch = <T extends FileBrowserEventTypes>(type: T, payload: Omit<FileBrowserEventPayload<T>, "type">) => window.dispatchEvent(new CustomEvent(FILE_BROWSER_EVENTS_CHANNEL, {
  detail: {
    ...payload,
    type: type as T,
  },
}));

function Clickable<T extends HTMLElement>(props: {
  onSingleClick: undefined | (() => void);
  onDoubleClick: undefined | (() => void);
  children: (onClick: MouseEventHandler<T>) => ReactElement;
}) {

  const clickTimeout = useRef<NodeJS.Timeout | null>(null);


  const handleClick: MouseEventHandler<T> = () => {
    if (clickTimeout.current) {
      // A second click happened within the delay → treat as double click
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      if (props.onDoubleClick !== undefined) props.onDoubleClick();
    } else {
      if(props.onSingleClick === undefined) {
        if(props.onDoubleClick) props.onDoubleClick();
      } else {
        // immediately fire first click
        props.onSingleClick();

        // Start a timer to detect whether a second click follows soon
        clickTimeout.current = setTimeout(() => clickTimeout.current = null, 500); // 500ms is default on windows: https://learn.microsoft.com/en-us/windows/win32/controls/ttm-setdelaytime?redirectedfrom=MSDN#remarks
      }
    }
  };

  return props.children(handleClick);

}

const SkeletonRow = () => (
  <TableRow>
    <TableCell>
      <Loader className={"text-muted"}/>
    </TableCell>
    {columns.map((_, index) => (
      <TableCell key={index} width={"50px"}>
        <Skeleton className="h-4 w-[50px]"/>
      </TableCell>
    ))}
    <TableCell align={"right"}>
      <Button disabled variant={"ghost"} size="icon" className="size-8">
        <IconDotsVertical/>
      </Button>
    </TableCell>
  </TableRow>
);

const NoneRow = () => (
  <TableRow>
    <TableCell
      colSpan={columns.length + 2}
      className="h-24 text-center"
    >
      {"Looks like you haven't created anything yet! Create something to get started."}
    </TableCell>
  </TableRow>
);

const DirectoryRow = ({ directory, project, navigate, onRowSelect, selectedRowId }: {
  directory: Tables<"directories">;
  project: Tables<"projects">;
  navigate: (url: string) => void;
  selectedRowId: string | undefined;
  onRowSelect: undefined | (() => void);
}) => (
  <Clickable
    onSingleClick={onRowSelect}
    onDoubleClick={() => navigate(`/dashboard/clients/${project.client_id}/${project.project_number}/${directory.id}`)}
  >
    {(onClick) => (
      <TableRow
        onClick={onClick}
        key={directory.id}
        className={cn(
          "cursor-pointer transition-colors",
          selectedRowId === directory.id
            ? "bg-accent/40 hover:bg-accent/50"
            : "hover:bg-muted/30"
        )}
      >
        <TableCell>
          <IconFolder/>
        </TableCell>
        {columns.map((col, index) => (
          <TableCell key={index} className={"last:text-right"}>
            {col.formatter ? col.formatter(directory[col.key]) : directory[col.key]}
          </TableCell>
        ))}
        <TableCell align={"right"}>
          <Button disabled variant={"ghost"} size="icon" className="size-8">
            <IconDotsVertical/>
          </Button>
        </TableCell>
      </TableRow>
    )}
  </Clickable>
);


const SymlinkRow = ({ symlink, project, navigate, supabase, onRowSelect, selectedRowId }: {
  symlink: Tables<"symlinks">;
  project: Tables<"projects">;
  navigate: (url: string) => void;
  supabase: SupabaseClient;
  selectedRowId: string | undefined;
  onRowSelect: undefined | (() => void);
}) => {

  const [ object, setObject ] = useState<Tables<{ schema: "storage" }, "objects"> | null>();

  const isLoading = object === undefined;

  // @ts-ignore
  const extension = (mime.extension(object?.metadata!.mimetype ?? "...") || "...") as DefaultExtensionType;

  useEffect(() => {
    (async () => {
      const {
        data: file,
        error
      } = await supabase.from("files").select("*, version:current_version_id (*)").eq("id", symlink.file_id).single().overrideTypes<Tables<"files"> & {
        version: Tables<"files_versions">
      }>();
      if (error) {
        console.error(error);
        return;
      }
      const {
        data: object,
        error: e
      } = await supabase.rpc("get_storage_object_by_id", { object_id: file.version.object_id });
      if (e) {
        console.error(e);
        return;
      }
      setObject(object);
    })();
  }, [ symlink.id ]);

  if (isLoading) return (<SkeletonRow/>);

  return (
    <Clickable
      onSingleClick={onRowSelect}
      onDoubleClick={() => navigate(`/dashboard/clients/${project.client_id}/${project.project_number}/${symlink.directory_id}/${symlink.id}`)}
    >
      {(onClick) => (
        <TableRow
          key={symlink.id}
          onClick={onClick}
          className={cn(
            "cursor-pointer transition-colors",
            selectedRowId === symlink.id
              ? "bg-accent/40 hover:bg-accent/50"
              : "hover:bg-muted/30"
          )}
        >
          <TableCell>
            <div>
              <FileIcon extension={extension} {...defaultStyles[extension]} />
            </div>
          </TableCell>
          {columns.map((col, index) => (
            <TableCell key={index} className={"last:text-right"}>
              {col.formatter ? col.formatter(symlink[col.key]!) : symlink[col.key]}
            </TableCell>
          ))}
          <TableCell align={"right"}>
            <Button disabled variant={"ghost"} size="icon" className="size-8">
              <IconDotsVertical/>
            </Button>
          </TableCell>
        </TableRow>
      )}
    </Clickable>
  );
};


const WithOrWithoutSymlinks = ({
                                 supabase,
                                 directories,
                                 symlinks,
                                 project,
                                 navigate,
                                 setSelectedRowId,
                                 selectedRowId,
                                 disableDirectorySelection,
                                 disableFileSelection
                               }: {
  directories: undefined | readonly Tables<"directories">[];
  symlinks: undefined | readonly Tables<"symlinks">[];
  project: Tables<"projects">;
  navigate: (url: string) => void;
  supabase: SupabaseClient;
  selectedRowId: string | undefined;
  setSelectedRowId: Dispatch<SetStateAction<string | undefined>>;
  disableFileSelection: boolean;
  disableDirectorySelection: boolean;
}) => {

  const items = (directories?.length ?? 0) + (symlinks?.length ?? 0);

  return (
    <Table>
      <TableHeader className="bg-muted sticky top-0 z-10">
        <TableRow>
          <TableHead/>
          {columns.map((col, index) => (
            <TableHead key={index} className={`last:text-right`}>
              {col.header}
            </TableHead>
          ))}
          <TableHead/>
        </TableRow>
      </TableHeader>
      <TableBody className="**:data-[slot=table-cell]:first:w-8">

        {items === 0 ? (
          <NoneRow/>
        ) : (
          <>
            {directories!.map((directory) => (
              <DirectoryRow
                key={directory.id}
                directory={directory}
                project={project}
                navigate={navigate}
                selectedRowId={selectedRowId}
                onRowSelect={disableDirectorySelection ? undefined : () => {
                  setSelectedRowId(directory.id);
                  dispatch(FileBrowserEventTypes.DIRECTORY_SELECTED, {
                    directory: directory,
                  });
                }}
              />
            ))}
            {symlinks!.map((symlink) => (
              <SymlinkRow
                supabase={supabase}
                key={symlink.id}
                symlink={symlink}
                project={project}
                navigate={navigate}
                selectedRowId={selectedRowId}
                onRowSelect={disableFileSelection ? undefined : () => {
                  setSelectedRowId(symlink.id);
                  dispatch(FileBrowserEventTypes.FILE_SELECTED, {
                    file: symlink,
                  })
                }}
              />
            ))}
          </>
        )}

      </TableBody>
    </Table>
  );
};


const WithoutSymlinks = (props: {
  project: Tables<"projects">;
  directories: undefined | readonly Tables<"directories">[];
  navigate: (url: string) => void;
  supabase: SupabaseClient;
  selectedRowId: string | undefined;
  setSelectedRowId: Dispatch<SetStateAction<string | undefined>>;
  disableFileSelection: boolean;
  disableDirectorySelection: boolean;
}) => {
  return (
    <WithOrWithoutSymlinks
      directories={props.directories}
      symlinks={[]}
      project={props.project}
      navigate={props.navigate}
      supabase={props.supabase}
      selectedRowId={props.selectedRowId}
      setSelectedRowId={props.setSelectedRowId}
      disableFileSelection={props.disableFileSelection}
      disableDirectorySelection={props.disableDirectorySelection}
    />
  );
};

const WithSymlinks = (props: {
  project: Tables<"projects">;
  directory: Tables<"directories">;
  directories: undefined | readonly Tables<"directories">[];
  navigate: (url: string) => void;
  supabase: SupabaseClient;
  selectedRowId: string | undefined;
  setSelectedRowId: Dispatch<SetStateAction<string | undefined>>;
  disableFileSelection: boolean;
  disableDirectorySelection: boolean;
}) => {

  const [ rows, setRows ] = useState<{ [id: string]: Tables<"symlinks"> }>({});

  useEffect(() => {
    props.supabase.from("symlinks").select()
      .eq("directory_id", props.directory.id)
      .then(({ data, error }) => {
        if (error) console.error(error);
        if (data) setRows(rows => data.reduce((previousValue, currentValue) => ({
          ...previousValue,
          [currentValue.id]: currentValue
        }), ({ ...rows })));
      });
  }, []);

  useRealtimeListener("symlinks", ({ type, payload }) => {
    switch (type) {
      case "INSERT":
      case "UPDATE":
        if (props.directory.id === payload.new.directory_id)
          setRows(rows => ({ ...rows, [payload.new.id]: payload.new }));
        return;
      case "DELETE":
        setRows(r => {
          const rows = { ...r };
          delete rows[payload.old.id];
          return rows;
        });
        return;
    }
  });

  return (
    <WithOrWithoutSymlinks
      directories={props.directories}
      symlinks={Object.values(rows)}
      project={props.project}
      navigate={props.navigate}
      supabase={props.supabase}
      selectedRowId={props.selectedRowId}
      setSelectedRowId={props.setSelectedRowId}
      disableFileSelection={props.disableFileSelection}
      disableDirectorySelection={props.disableDirectorySelection}
    />
  );
};


export default function FileBrowserTable(props: {
  directory: Tables<"directories"> | null;
  project: Tables<"projects">;
  navigate: (url: string) => void;
  supabase: SupabaseClient;
  disableFileSelection?: boolean;
  disableDirectorySelection?: boolean;
}) {

  const [ selectedRowId, setSelectedRowId ] = useState<string | undefined>();
  const [ rows, setRows ] = useState<{ [id: string]: Tables<"directories"> }>({});

  useEffect(() => {

    let query = props.supabase.from("directories").select()
      .eq("project_id", props.project.id);

    if (!props.directory?.id) query = query.is("parent_id", null);
    else query = query.eq("parent_id", props.directory.id);

    query.then(({ data, error }) => {
      if (error) console.error(error);
      if (data) setRows(rows => data.reduce((previousValue, currentValue) => ({
        ...previousValue,
        [currentValue.id]: currentValue
      }), ({ ...rows })));
    });

    // clear rows whenever directory changes
    return () => {
      setRows({});
      setSelectedRowId(undefined);
    };

  }, [ props.directory?.id ]);

  useRealtimeListener("directories", ({ type, payload }) => {
    switch (type) {
      case "INSERT":
      case "UPDATE":
        if (payload.new.project_id === props.project.id && (props.directory?.id ?? null) === payload.new.parent_id)
          setRows(rows => ({ ...rows, [payload.new.id]: payload.new }));
        return;
      case "DELETE":
        setRows(r => {
          const rows = { ...r };
          delete rows[payload.old.id];
          return rows;
        });
        return;
    }
  });

  return (
    props.directory === null ?
      <WithoutSymlinks
        project={props.project}
        directories={Object.values(rows)}
        navigate={props.navigate}
        supabase={props.supabase}
        selectedRowId={selectedRowId}
        setSelectedRowId={setSelectedRowId}
        disableDirectorySelection={props.disableDirectorySelection ?? false}
        disableFileSelection={props.disableFileSelection ?? false}
      /> :
      <WithSymlinks
        directories={Object.values(rows)}
        directory={props.directory}
        project={props.project}
        navigate={props.navigate}
        supabase={props.supabase}
        selectedRowId={selectedRowId}
        setSelectedRowId={setSelectedRowId}
        disableDirectorySelection={props.disableDirectorySelection ?? false}
        disableFileSelection={props.disableFileSelection ?? false}
      />
  );

}