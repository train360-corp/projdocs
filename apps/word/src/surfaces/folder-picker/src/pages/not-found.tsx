import { useLocation } from "react-router";
import { PageContent } from "@workspace/ui/components/page-content";
import { H2, P } from "@workspace/ui/components/text";



export const NotFound = () => {

  const { pathname } = useLocation();

  return (
    <PageContent className={"flex flex-col items-center justify-center"}>
      <H2>{"Uh, oh..."}</H2>

      <div className={"flex flex-col items-center justify-center"}>
        <P>{"The page you requested was not found!"}</P>

        <P className={"text-secondary"}>{pathname}</P>
      </div>
    </PageContent>
  )

}