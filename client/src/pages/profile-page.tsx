import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { PostCard } from "@/components/posts/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Post } from "@shared/schema";

type PostWithUsername = Post & { username?: string };

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: posts = [] } = useQuery<PostWithUsername[]>({
    queryKey: ["/api/posts"],
  });

  const userPosts = posts.filter(post => post.userId === user?.id);

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
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
            <div>
              <h3 className="font-medium">Total Posts</h3>
              <p className="text-muted-foreground">{userPosts.length}</p>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mt-8">Your Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
