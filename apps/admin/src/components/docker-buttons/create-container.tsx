"use client";


import { Button } from "@workspace/ui/components/button.tsx";
import { DockerService } from "../../../app/dashboard/page.tsx";
import { createContainer } from "./action.ts";
import { ContainerInspectResponses } from "@workspace/admin/lib/docker/gen";
import { LoaderIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";



export const CreateContainerButton = ({ svc, container }: {
  svc: DockerService;
  container: ContainerInspectResponses["200"] | undefined;
}) => {

  const [ loading, setLoading ] = useState(false);
  const exists = container?.Id !== undefined;
  const disabled = loading || exists;

  return (
    <Button
      size={"icon"}
      variant={exists ? "ghost" : undefined}
      disabled={disabled}
      onClick={async () => {
        setLoading(true);
        try {
          await createContainer({ svc });
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
        : <PlusIcon/>
      }
    </Button>
  );
};