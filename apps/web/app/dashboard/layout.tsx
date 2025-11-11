"use client";
import { ReactNode } from "react";
import { DashboardLayout } from "@workspace/web/components/_layout";



export default function Layout({ children }: {
  children: ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );

}