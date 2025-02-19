import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "./button";
import { UserCircle } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Mero KamKotha
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <a>
                <Button variant={location === "/profile" ? "default" : "ghost"} className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  Profile
                </Button>
              </a>
            </Link>
            <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}