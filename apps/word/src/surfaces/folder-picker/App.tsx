import React, { ReactNode, useEffect, useState } from "react";
import { MemoryRouter } from "react-router";
import { Layout } from "@workspace/word/surfaces/folder-picker/src/layout";
import { SupabaseRealtimeListener } from "@workspace/supabase/realtime/listener";
import { v4 } from "uuid";
import { createClient } from "@workspace/supabase/client";
import { CONSTANTS } from "@workspace/word/lib/consts";
import { LoadingPage } from "@workspace/ui/pages/loading";
import { H3, P } from "@workspace/ui/components/text";
import { ThemeProvider } from "@workspace/desktop/src/theme/theme-provider";
import { Card, CardAction, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  FileSelectorParentMessage,
  FileSelectorParentMessageTypes
} from "@workspace/word/surfaces/ribbon/actions/save-as-new-document";



export default function App() {
  return (
    <MemoryRouter initialEntries={[ "/dashboard" ]}>
      <ThemeProvider>
        <IsConnected>
          <Realtime>
            <Layout/>
          </Realtime>
        </IsConnected>
      </ThemeProvider>
    </MemoryRouter>
  );
}

const IsConnected = ({ children }: {
  children: ReactNode;
}) => {

  const [ isConnected, setIsConnected ] = useState<boolean | undefined>();

  const testConnection = () => {

    const connectionAttempted = isConnected !== undefined;

    setIsConnected(undefined);
    const delay: Promise<boolean> = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000));
    const healthz: Promise<boolean> = new Promise<boolean>(async (resolve) => await fetch(`${CONSTANTS.DESKTOP.HTTP_SERVER.ORIGIN}/healthz`).then((response) => resolve(response.status === 200)).catch(() => resolve(false)));

    const _do = () => Promise.race([ delay, healthz ]).then(setIsConnected);

    // delay to avoid flickering
    if (connectionAttempted) (new Promise(r => setTimeout(r, 500))).then(_do);
    else _do();
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    isConnected === undefined
      ? (<LoadingPage msg={"Checking desktop connection..."}/>)
      : isConnected
        ? children
        : (
          <div className={"bg-background w-full h-full flex flex-col items-center justify-center"}>
            <Card>
              <CardHeader>
                <H3>{"Unable to Connect to ProjDocs Desktop"}</H3>
              </CardHeader>
              <CardContent>
                <P>{"Microsoft Word was unable to connect to ProjDocs Desktop. Is it running?"}</P>
              </CardContent>
              <CardAction className={"w-full flex flex-row gap-2 justify-end"}>
                <Button
                  variant={"ghost"}
                  onClick={() => Office.context.ui.messageParent(JSON.stringify({
                    type: FileSelectorParentMessageTypes.CLOSE,
                    body: {}
                  } satisfies FileSelectorParentMessage))}
                >
                  {"Close"}
                </Button>
                <Button onClick={testConnection}>
                  {"Try Again"}
                </Button>
              </CardAction>
            </Card>
          </div>
        )
  );

};

const Realtime = ({ children }: {
  children: ReactNode;
}) => {

  const [ channel ] = useState(v4());
  const supabase = createClient();

  useEffect(() => {
    console.log(`realtime channel: ${channel}`);
  }, [ channel ]);

  return (
    <SupabaseRealtimeListener supabase={supabase} channel={channel}>
      {children}
    </SupabaseRealtimeListener>
  );

};