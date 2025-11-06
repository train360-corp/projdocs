import { ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";



export const PageContent = ({ children, className }: {
  children?: ReactNode;
  className?: string;
}) => (
  <div className="@container/main flex flex-1 flex-col gap-2 max-h-full">
    <div className={cn("flex flex-col gap-4 p-4 md:gap-6 md:p-6 h-full", className)}>
      {children}
    </div>
  </div>
);