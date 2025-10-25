import { Geist, Geist_Mono } from "next/font/google";
import "./index.css";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import { Toaster } from "@workspace/ui/components/sonner";
import { ReactNode } from "react";
import Script from 'next/script'
import * as process from "node:process";



const fontSans = Geist({
  subsets: [ "latin" ],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: [ "latin" ],
  variable: "--font-mono",
});

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <head title={"ProjDocs"}>
      <meta name={"description"} content={"A project-oriented document management system!"}/>
    </head>
    <body
      className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
    >
    {/*<script>*/}
    {/*  {"window.env = {" +*/}
    {/*    `'SUPABASE_PUBLIC_URL':'${process.env.SUPABASE_PUBLIC_URL}',` +*/}
    {/*    `'SUPABASE_PUBLIC_KEY':'${process.env.SUPABASE_PUBLIC_KEY}'` +*/}
    {/*    "};console.log(window.env);"}*/}
    {/*</script>*/}
    <script>{`
  window.env = {
    SUPABASE_PUBLIC_URL: '${process.env.SUPABASE_PUBLIC_URL}',
    SUPABASE_PUBLIC_KEY: '${process.env.SUPABASE_PUBLIC_KEY}'
  };
`}</script>
    <Toaster/>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {children}
    </ThemeProvider>
    </body>
    </html>
  );
}