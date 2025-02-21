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
import { Search, Plus, Building2, Briefcase, Sparkles } from "lucide-react";
import { socket } from "@/lib/socket";
import { queryClient } from "@/lib/queryClient";
import type { Post } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

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
      console.log("Received new post:", newPost);
      queryClient.setQueryData<PostWithUsername[]>(
        ["/api/posts"],
        (old = []) => {
          const exists = old.some(p => p.id === newPost.id);
          if (exists) return old;
          return [newPost, ...old];
        }
      );
    });

    socket.on("post-updated", (updatedPost: PostWithUsername) => {
      console.log("Post updated:", updatedPost);
      queryClient.setQueryData<PostWithUsername[]>(
        ["/api/posts"],
        (old = []) => old?.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        ) || []
      );
    });

    socket.on("post-deleted", (deletedPostId: number) => {
      console.log("Post deleted:", deletedPostId);
      queryClient.setQueryData<PostWithUsername[]>(
        ["/api/posts"],
        (old = []) => old.filter(post => post.id !== deletedPostId)
      );
    });

    return () => {
      socket.off("new-post");
      socket.off("post-updated");
      socket.off("post-deleted");
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
        >
          <div className="container mx-auto py-16 px-4">
            <div className="max-w-2xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2 group">
                      <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                      <span>Create New Post</span>
                      <Sparkles className="h-4 w-4 text-primary-foreground/80 animate-pulse" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <PostForm />
                  </DialogContent>
                </Dialog>
              </motion.div>
            </div>
          </div>
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:30px_30px] pointer-events-none" />
        </motion.div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Search and Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-card rounded-lg p-6 shadow-sm backdrop-blur-sm bg-white/50 dark:bg-black/50"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-hover:text-primary" />
                <Input
                  placeholder="Search posts..."
                  className="pl-9 transition-all border-muted-foreground/20 hover:border-primary/50 focus:border-primary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Tabs 
                value={postType} 
                onValueChange={(v) => setPostType(v as any)} 
                className="w-full md:w-auto"
              >
                <TabsList className="grid w-full md:w-auto grid-cols-3 h-10">
                  <TabsTrigger value="all" className="px-4">All</TabsTrigger>
                  <TabsTrigger value="room" className="px-4 gap-2">
                    <Building2 className="h-4 w-4" />
                    Rooms
                  </TabsTrigger>
                  <TabsTrigger value="job" className="px-4 gap-2">
                    <Briefcase className="h-4 w-4" />
                    Jobs
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </motion.div>

          {/* Results Section */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between"
            >
              <h2 className="text-2xl font-semibold">
                {postType === "all" ? "All Posts" : 
                 postType === "room" ? "Room Listings" : "Job Opportunities"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
              </p>
            </motion.div>

            <AnimatePresence>
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
                {filteredPosts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full"
                  >
                    <div className="bg-muted/50 rounded-lg p-8 text-center">
                      <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                      <p className="text-muted-foreground mb-4">
                        {search ? 
                          "Try adjusting your search terms or filters" : 
                          "Be the first to create a post!"}
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="gap-2">
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
    </Layout>
  );
}