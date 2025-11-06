import { SupabaseClient, Tables } from "@workspace/supabase/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { columns } from "@workspace/web/components/file-browser-directory-columns";
import { useDebounce } from "@uidotdev/usehooks";
import { IconDotsVertical, IconFolder } from "@tabler/icons-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";
import { DefaultExtensionType, defaultStyles, FileIcon } from "react-file-icon";
import * as mime from "react-native-mime-types";
import { NIL } from "uuid";
import { useRealtimeListener } from "@workspace/supabase/realtime/subscriber";



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

const DirectoryRow = ({ directory, project, navigate }: {
  directory: Tables<"directories">;
  project: Tables<"projects">;
  navigate: (url: string) => void;
}) => (
  <TableRow
    key={directory.id}
    className={"cursor-pointer"}
    onClick={() => navigate(`/dashboard/clients/${project.client_id}/${project.project_number}/${directory.id}`)}
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
);


const SymlinkRow = ({ symlink, project, navigate, supabase }: {
  symlink: Tables<"symlinks">;
  project: Tables<"projects">;
  navigate: (url: string) => void;
  supabase: SupabaseClient;
}) => {

  const [ object, setObject ] = useState<Tables<{ schema: "storage" }, "objects"> | null>();

  const isLoading = object === undefined;

  // @ts-ignore
  const extension = (mime.extension(object?.metadata!.mimetype ?? "...") || "...") as DefaultExtensionType;

  useEffect(() => {
    (async () => {
      const { data: file } = await supabase.from("files").select("*, current_version_id (*)").eq("id", symlink.file_id).single();
      const { data: object } = await supabase.rpc("storage.objects.get_object_by_id", { object_id: file?.current_version_id?.object_id ?? NIL });
      setObject(object);
    })();
  }, [ symlink.id ]);

  if (isLoading) return (<SkeletonRow/>);

  return (
    <TableRow
      key={symlink.id}
      className={"cursor-pointer"}
      onClick={() => navigate(`/dashboard/clients/${project.client_id}/${project.project_number}/${symlink.directory_id}/${symlink.id}`)}
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
  );
};


const WithOrWithoutSymlinks = ({ supabase, directories, symlinks, project, navigate }: {
  directories: undefined | readonly Tables<"directories">[];
  symlinks: undefined | readonly Tables<"symlinks">[];
  project: Tables<"projects">;
  navigate: (url: string) => void;
  supabase: SupabaseClient;
}) => {

  const isLoading = useDebounce((directories === undefined || symlinks === undefined), 500);
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

        {isLoading ? (
          <SkeletonRow/>
        ) : items === 0 ? (
          <NoneRow/>
        ) : (
          <>
            {directories!.map((directory) => (
              <DirectoryRow
                key={directory.id}
                directory={directory}
                project={project}
                navigate={navigate}
              />
            ))}
            {symlinks!.map((symlink) => (
              <SymlinkRow
                supabase={supabase}
                key={symlink.id}
                symlink={symlink}
                project={project}
                navigate={navigate}
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
}) => {
  return (
    <WithOrWithoutSymlinks
      directories={props.directories}
      symlinks={[]}
      project={props.project}
      navigate={props.navigate}
      supabase={props.supabase}
    />
  );
};

const WithSymlinks = (props: {
  project: Tables<"projects">;
  directory: Tables<"directories">;
  directories: undefined | readonly Tables<"directories">[];
  navigate: (url: string) => void;
  supabase: SupabaseClient;
}) => {

  const [ rows, setRows ] = useState<{ [id: string]: Tables<"symlinks"> }>({});

  useEffect(() => {
    props.supabase.from("symlinks").select()
      .eq("directory_id", props.directory.id)
      .then(({ data, error }) => {
        if(error) console.error(error);
        if(data) setRows(rows => data.reduce((previousValue, currentValue) => ({ ...previousValue, [currentValue.id]: currentValue }) , ({ ...rows })))
      })
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
    />
  );
};


export default function FileBrowserTable(props: {
  directory: Tables<"directories"> | null;
  project: Tables<"projects">;
  navigate: (url: string) => void;
  supabase: SupabaseClient;
}) {

  const [ rows, setRows ] = useState<{ [id: string]: Tables<"directories"> }>({});

  useEffect(() => {
    props.supabase.from("directories").select()
      .eq("project_id", props.project.id)
      // @ts-expect-error reporting null as not possible value, but it is
      .is("parent_id", props.directory?.id ?? null)
      .then(({ data, error }) => {
        if(error) console.error(error);
        if(data) setRows(rows => data.reduce((previousValue, currentValue) => ({ ...previousValue, [currentValue.id]: currentValue }) , ({ ...rows })))
      })
  }, []);

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
      /> :
      <WithSymlinks
        directories={Object.values(rows)}
        directory={props.directory}
        project={props.project}
        navigate={props.navigate}
        supabase={props.supabase}
      />
  );

}