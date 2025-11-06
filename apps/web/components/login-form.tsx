"use client";

import { cn } from "@workspace/ui/lib/utils";
import { createClient } from "@workspace/supabase/client";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComponentPropsWithoutRef, FormEvent, useState } from "react";



export function LoginForm({ className, ...props }: ComponentPropsWithoutRef<"div">) {

  const [ email, setEmail ] = useState(process.env.NODE_ENV === "development" ? "harvey@pearsonspecter.com" : "");
  const [ password, setPassword ] = useState(process.env.NODE_ENV === "development" ? "password123" : "");
  const [ error, setError ] = useState<string | null>(null);
  const [ isLoading, setIsLoading ] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // handle different return types
    const query = new URLSearchParams(window.location.search);
    const redirectType = query.get("redirect-type") ?? "web";
    try {
      switch (redirectType) {
        case "desktop":

          // get login and persist it
          const r = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (r.error) throw r.error;

          const res = await fetch("/api/v1/auth/desktop")

          if (res.status !== 200) {
            throw new Error(res.statusText);
          } else {
            const jwt: string = await res.json();


            const path = query.get("redirect-to");
            if (path === null) throw new Error("Redirect query param is missing!");

            const url = new URL("projdocs://");
            url.pathname = path;
            url.searchParams.set("jwt", jwt);
            url.searchParams.set("url", window.location.origin);
            // @ts-expect-error accessing protected property
            url.searchParams.set("supabase-key", supabase.supabaseKey);
            // @ts-expect-error accessing protected property
            url.searchParams.set("supabase-url", supabase.supabaseUrl);

            // execute callback
            open(url.toString());
            router.push("/");
          }
          break;
        case "web":
          // get login and persist it
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          // Update this route to redirect to an authenticated route. The user already has an active session.
          router.push("/dashboard");
          break;
        default:
          throw new Error(`Rediect Type "${query.get("redirect-type")}" is unhandled!`);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
