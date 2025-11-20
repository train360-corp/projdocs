"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button.tsx";
import { startContainer } from "@workspace/admin/components/docker-buttons/action.ts";
import { toast } from "sonner";
import { LoaderIcon, PlayIcon } from "lucide-react";
import { ContainerInspectResponses } from "@workspace/admin/lib/docker/gen";



export const StartContainerButton = ({ container }: {
  container: ContainerInspectResponses["200"] | undefined;
}) => {

  const [ loading, setLoading ] = useState(false);
  const running = container?.State?.Status === "running";
  const disabled = loading || running || !container?.Id;

  return (
    <Button
      size={"icon"}
      variant={"ghost"}
      disabled={disabled}
      onClick={async () => {
        setLoading(true);
        try {
          await startContainer({ id: container?.Id! });
        } catch (error) {
          toast.error("An Error Occurred!");
          console.error(error);
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading
        ? <LoaderIcon/>
        : <PlayIcon/>
      }
    </Button>
  );
};