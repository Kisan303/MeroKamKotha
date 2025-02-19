import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Mero KamKotha
          </h1>
          <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
