import { InlineCode, P } from "@workspace/ui/components/text.tsx";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@workspace/ui/components/table.tsx";
import { docker } from "@workspace/admin/lib/docker";
import { ContainerInspectResponses, Service } from "@workspace/admin/lib/docker/gen";
import { ReactNode } from "react";
import { Badge } from "@workspace/ui/components/badge.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip.tsx";
import { DateTime } from "luxon";
import { cn } from "@workspace/ui/lib/utils.ts";
import { CreateContainerButton } from "@workspace/admin/components/docker-buttons/create-container.tsx";
import { StartContainerButton } from "@workspace/admin/components/docker-buttons/start-container.tsx";
import { DockerService } from "@workspace/admin/lib/docker/types.ts";



const Status = ({ status }: { status: boolean }) => (
  <span
    className={cn(
      "inline-block h-2.5 w-2.5 rounded-full",
      status ? "bg-green-500" : "bg-red-500"
    )}
  />
);

type FilterKeys<T, Values = string | undefined> = {
  [K in keyof T]: T[K] extends Values ? K : never
}[keyof T];

const Image = async ({ sha }: {
  sha: string;
}) => {

  const { data } = await docker.imageInspect({ path: { name: sha } });

  if (data && data.RepoTags && data.RepoTags.length > 0) return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={"outline"}>{data.RepoTags[0]}</Badge>
      </TooltipTrigger>
      <TooltipContent>
        <P>{data.Id}</P>
      </TooltipContent>
    </Tooltip>
  );


  if (data?.Id) return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={"outline"}>{data.Id.substring(data.Id.length - 6)}</Badge>
      </TooltipTrigger>
      <TooltipContent>
        <P>{data.Id}</P>
      </TooltipContent>
    </Tooltip>
  );

  return undefined;
};

const columns: ReadonlyArray<{
  display: string,
  value: FilterKeys<ContainerInspectResponses["200"]> | ((service: ContainerInspectResponses["200"] | undefined, _id: DockerService) => string | undefined | ReactNode)
}> = [
  {
    display: "Service",
    value: (c, id) => (
      <div className={"flex flex-row gap-2 items-center"}>
        <Status status={c?.State?.Status === "running"}/>
        <P>{id}</P>
        {c?.Id !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={"outline"}>{c.Id.substring(c.Id.length - 6)}</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <P>{c.Id}</P>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  },
  {
    display: "Status",
    value: (c) => c?.State?.Status
  },
  {
    display: "Created",
    value: (c) => c?.Created !== undefined ? DateTime.fromISO(c.Created).toRelative() : undefined
  },
  {
    display: "Image",
    value: (c) => c?.Image !== undefined ? (
      <Image sha={c.Image}/>
    ) : undefined
  },
  {
    display: "Actions",
    value: (c, id) => (
      <div className={"flex flex-row items-center justify-end"}>
        {c?.Id === undefined ? (
          <CreateContainerButton container={c} svc={id}/>
        ) : (
          <>
            <StartContainerButton container={c} />
          </>
        )}
      </div>
    )
  }
];

const Container = async ({ service }: {
  service: DockerService;
}) => {

  const container = await docker.containerInspect({ path: { id: service } });

  return (
    <TableRow>
      {columns.map((column, key, array) => (
        <TableCell
          key={key}
          className={key === array.length - 1 ? "text-right" : undefined}
        >
          {typeof column.value === "string" ? (container.data !== undefined ? container.data[column.value] : "") : column.value!(container.data, service)}
        </TableCell>
      ))}
    </TableRow>
  );

};

export default async function () {

  const isDockerOnline = await docker.systemPing();
  const { data: dockerInfo } = await docker.systemInfo();

  return (
    <div className={"p-4"}>
      <div className={"flex flex-col gap-4"}>
        <Card className={"w-full md:w-1/2"}>
          <CardHeader>
            <div className={"flex flex-row items-center gap-2"}>
              <Status status={isDockerOnline.status === 200}/>
              <P>{"Docker"}</P>
              {dockerInfo?.ServerVersion && (
                <InlineCode>{dockerInfo.ServerVersion}</InlineCode>
              )}
            </div>
            <CardContent>

            </CardContent>
          </CardHeader>
        </Card>

        <Card className={"py-0 overflow-hidden"}>
          <Table>

            <TableHeader>
              <TableRow>
                {columns.map((column, index, array) => (
                  <TableHead
                    className={cn("font-bold", index === array.length - 1 ? "text-right" : undefined)}
                    key={`HeaderColumn-${index}`}
                  >
                    {column.display}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <Container service={DockerService.KONG}/>
              <Container service={DockerService.DB}/>
              <Container service={DockerService.REALTIME}/>
              <Container service={DockerService.REST} />
            </TableBody>
          </Table>
        </Card>

      </div>
    </div>
  );
}
