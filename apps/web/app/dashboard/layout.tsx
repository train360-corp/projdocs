import { ReactNode } from "react";
import { createClient } from "@workspace/web/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@workspace/web/components/_layout";

// const DashboardLayout = ({ children }: { children: ReactNode }) => children;


export default async function LoginGuard({ children }: {
  children: ReactNode;
}) {

  const supabase = await createClient();
  const { data: user, error } = await supabase.auth.getUser();

  if (error || !user?.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );

}