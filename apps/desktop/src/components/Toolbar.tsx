import React, { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { Button } from "@workspace/ui/components/button";
import { OctagonX } from "lucide-react";
import { AuthStatus, useAuthStore } from "@workspace/desktop/src/lib/auth/store";
import { P } from "@workspace/ui/components/text";
import { cn } from "@workspace/ui/lib/utils";



export const Toolbar = () => {

  const [ urlHovered, setUrlHovered ] = useState(false);
  const [ quitButtonHovered, setQuitButtonHovered ] = useState(false);
  const auth = useAuthStore();

  return (
    <div className={"flex flex-row justify-between items-center align-middle w-full p-2"}>

      {auth.state.state === AuthStatus.LOGGED_IN && (
        <div className={"align-middle justify-center"}>
          <P
            onMouseEnter={() => setUrlHovered(true)}
            onMouseLeave={() => setUrlHovered(false)}
            onClick={() => window.app.open(auth.state.settings!.url)}
            className={cn(
              "text-xs pl-2 cursor-pointer transition-colors",
              urlHovered ? "text-primary" : "text-muted-foreground"
            )}
          >
            {auth.state.settings.url}
          </P>
        </div>
      )}

      <div className={"ml-auto"}>
        <Tooltip onOpenChange={setQuitButtonHovered}>
          <TooltipTrigger asChild>
            <Button
              variant={"ghost"}
              size={"sm"}
              onClick={async () => await window.app.quit()}
            >
              <OctagonX className={cn("transition-colors", quitButtonHovered ? "text-primary" : "text-muted-foreground")} size={5}/>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{"Quit ProjDocs Desktop"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

    </div>
  );
};