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
import { Search } from "lucide-react";
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
    // Listen for new posts
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

    // Listen for updated posts
    socket.on("post-updated", (updatedPost: PostWithUsername) => {
      console.log("Post updated:", updatedPost);
      queryClient.setQueryData<PostWithUsername[]>(
        ["/api/posts"],
        (old = []) => old?.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        ) || []
      );
    });

    // Listen for deleted posts
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

  // Sort posts by newest first
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
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h1 className="text-3xl font-bold">Welcome, {user.username}!</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Create Post</Button>
            </DialogTrigger>
            <DialogContent>
              <PostForm />
            </DialogContent>
          </Dialog>
        </div>

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
          <Tabs value={postType} onValueChange={(v) => setPostType(v as any)} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="room">Rooms</TabsTrigger>
              <TabsTrigger value="job">Jobs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </Layout>
  );
}