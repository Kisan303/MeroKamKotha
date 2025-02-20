import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { PostCard } from "@/components/posts/post-card";
import { PostForm } from "@/components/posts/post-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Bookmark } from "lucide-react";
import type { Post } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PostWithUsername = Post & { username?: string };

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: posts = [] } = useQuery<PostWithUsername[]>({
    queryKey: ["/api/posts"],
  });

  const { data: bookmarkedPosts = [] } = useQuery<PostWithUsername[]>({
    queryKey: ["/api/user/bookmarks"],
    enabled: !!user,
  });

  const userPosts = posts.filter(post => post.userId === user?.id);
  const roomPosts = userPosts.filter(post => post.type === "room");
  const jobPosts = userPosts.filter(post => post.type === "job");

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Full Name</h3>
                <p className="text-muted-foreground">{user.fullname}</p>
              </div>
              <div>
                <h3 className="font-medium">Username</h3>
                <p className="text-muted-foreground">{user.username}</p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Room Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{roomPosts.length}</p>
              <p className="text-muted-foreground">Active room listings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{jobPosts.length}</p>
              <p className="text-muted-foreground">Active job listings</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts">Your Posts</TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Posts ({bookmarkedPosts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Posts</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create New Post
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <PostForm />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {userPosts.length === 0 && (
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">You haven't created any posts yet.</p>
                  <p className="text-muted-foreground">Click the 'Create New Post' button to get started!</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Saved Posts
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {bookmarkedPosts.length === 0 && (
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">You haven't saved any posts yet.</p>
                  <p className="text-muted-foreground">Click the 'Save' button on posts to add them to your bookmarks!</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}