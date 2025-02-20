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
import { Search, Plus, Building2, Briefcase } from "lucide-react";
import { socket } from "@/lib/socket";
import { queryClient } from "@/lib/queryClient";
import type { Post } from "@shared/schema";

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
      <div className="container mx-auto py-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-8 mb-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">Welcome to Mero KamKotha</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Find your perfect room or dream job opportunity. Connect with property owners and employers in your area.
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
        </div>

        {/* Search and Filter Section */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search posts..."
                className="pl-9"
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
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {postType === "all" ? "All Posts" : 
               postType === "room" ? "Room Listings" : "Job Opportunities"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {filteredPosts.length === 0 && (
              <div className="col-span-full">
                <div className="bg-muted/50 rounded-lg p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {search ? 
                      "Try adjusting your search terms or filters" : 
                      "Be the first to create a post!"}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <PostForm />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}