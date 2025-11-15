import RootLayout from "./layout";
import { H2, P } from "@workspace/ui/components/text";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";



export default function GlobalNotFound() {
  return (
    <RootLayout>
      <div className={"w-full h-full flex flex-col items-center justify-center"}>
        <Card>
          <CardHeader><H2>{"Uh, oh..."}</H2></CardHeader>
          <CardContent>
            <P>{"The page you are looking for could not be found!"}</P>
          </CardContent>
        </Card>
      </div>
    </RootLayout>
  )
}