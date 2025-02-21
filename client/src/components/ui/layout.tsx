import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "./button";
import { UserCircle, Mail, Github, Plus, Sparkles, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PostForm } from "@/components/posts/post-form";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isProfilePage = location === "/profile";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Button variant="link" className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Mero KamKotha
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about">
              <Button variant={location === "/about" ? "default" : "ghost"}>
                About
              </Button>
            </Link>
            {user ? (
              <>
                <Link href="/profile">
                  <Button variant={location === "/profile" ? "default" : "ghost"} className="gap-2">
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                {isProfilePage ? (
                  <Button 
                    variant="default"
                    className="gap-2"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2 group">
                        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                        <span>Create Post</span>
                        <Sparkles className="h-4 w-4 text-primary-foreground/80 animate-pulse" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <PostForm />
                    </DialogContent>
                  </Dialog>
                )}
              </>
            ) : (
              <Button variant="default" asChild>
                <Link href="/auth" className="gap-2">
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">{children}</main>

      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Developer</h3>
              <p className="text-muted-foreground">
                Developed by Kisan Rai, a Full Stack Software Developer and Lambton College Student.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Mail className="h-4 w-4" />
                <a href="mailto:kisanrai939@gmail.com" className="text-primary hover:underline">
                  kisanrai939@gmail.com
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/">
                  <Button variant="link" className="p-0">Home</Button>
                </Link>
                <br />
                <Link href="/about">
                  <Button variant="link" className="p-0">About</Button>
                </Link>
                <br />
                <Link href="/profile">
                  <Button variant="link" className="p-0">Profile</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mero KamKotha. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}