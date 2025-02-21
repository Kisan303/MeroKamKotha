import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { PostCard } from "@/components/posts/post-card";
import { PostForm } from "@/components/posts/post-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus, Building2, Briefcase, Sparkles, UserCircle, LogIn } from "lucide-react";
import { socket } from "@/lib/socket";
import { queryClient } from "@/lib/queryClient";
import type { Post } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

type PostWithUsername = Post & { username?: string };

export default function HomePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [postType, setPostType] = useState<"all" | "room" | "job">("all");

  const { data: posts = [] } = useQuery<PostWithUsername[]>({
    queryKey: ["/api/posts"],
  });

  useEffect(() => {
    socket.on("new-post", (newPost: PostWithUsername) => {
      queryClient.setQueryData<PostWithUsername[]>(
        ["/api/posts"],
        (old = []) => {
          const exists = old.some(p => p.id === newPost.id);
          if (exists) return old;
          return [newPost, ...old];
        }
      );
    });

    return () => {
      socket.off("new-post");
    };
  }, []);

  const sortedPosts = [...posts].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredPosts = sortedPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
                         post.description.toLowerCase().includes(search.toLowerCase()) ||
                         post.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = postType === "all" || post.type === postType;
    return matchesSearch && matchesType;
  });

  if (!user) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-purple-50/5 to-primary/5">
        {/* Navigation Header - Fixed */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-muted-foreground/10">
          <div className="container mx-auto h-16 flex items-center justify-between px-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Mero KamKotha
            </h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/about" className="gap-2">
                  About
                </Link>
              </Button>
              {user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/profile" className="gap-2">
                      <UserCircle className="h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2 group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/20 transition-all duration-300">
                        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                        <span>Create Post</span>
                        <Sparkles className="h-4 w-4 text-white/80 animate-pulse" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <PostForm />
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <Button 
                  variant="default" 
                  asChild
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/20"
                >
                  <Link href="/auth" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable with sticky search */}
        <div className="pt-16"> {/* Offset for fixed header */}
          {/* Welcome Section - Scrollable */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent py-16"
          >
            <div className="container mx-auto px-4">
              <div className="max-w-2xl">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-primary/60 bg-clip-text text-transparent"
                >
                  Welcome to Mero KamKotha
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-lg text-muted-foreground mb-6"
                >
                  Find your perfect room or dream job opportunity. Connect with property owners and employers in your area.
                </motion.p>
              </div>
            </div>
            <div className="absolute inset-0 bg-grid-white/10 bg-[size:30px_30px] pointer-events-none" />
          </motion.div>

          {/* Search and Filter Section - Sticky */}
          <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-lg border-b border-muted-foreground/10">
            <div className="container mx-auto p-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl bg-gradient-to-br from-white/40 to-white/10 dark:from-gray-900/40 dark:to-gray-900/10 backdrop-blur-md border border-white/20 dark:border-gray-800/20 shadow-xl p-4 transform hover:scale-[1.01] transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <motion.div
                    className="relative flex-1 w-full md:w-auto group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-hover:text-primary" />
                    <Input
                      placeholder="Search posts..."
                      className="pl-9 pr-4 h-11 transition-all border-muted-foreground/20 hover:border-primary/50 focus:border-primary w-full md:w-[400px] bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Tabs
                      value={postType}
                      onValueChange={(v) => setPostType(v as any)}
                      className="w-full md:w-auto"
                    >
                      <TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm rounded-lg">
                        <TabsTrigger
                          value="all"
                          className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          value="room"
                          className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
                        >
                          <Building2 className="h-4 w-4" />
                          Rooms
                        </TabsTrigger>
                        <TabsTrigger
                          value="job"
                          className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
                        >
                          <Briefcase className="h-4 w-4" />
                          Jobs
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Posts Section - Scrollable */}
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-between"
              >
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary via-purple-500 to-primary/60 bg-clip-text text-transparent">
                  {postType === "all" ? "All Posts" :
                    postType === "room" ? "Room Listings" : "Job Opportunities"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
                </p>
              </motion.div>

              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className="grid grid-cols-1 gap-6 max-w-3xl mx-auto"
                >
                  {filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="transform hover:scale-[1.02] transition-all duration-300"
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                  {filteredPosts.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="bg-gradient-to-br from-white/40 to-white/10 dark:from-gray-900/40 dark:to-gray-900/10 backdrop-blur-md border border-white/20 dark:border-gray-800/20 rounded-xl p-8 text-center shadow-xl">
                        <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">No posts found</h3>
                        <p className="text-muted-foreground mb-4">
                          {search ?
                            "Try adjusting your search terms or filters" :
                            "Be the first to create a post!"}
                        </p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/20">
                              <Plus className="h-4 w-4" />
                              Create New Post
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <PostForm />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}