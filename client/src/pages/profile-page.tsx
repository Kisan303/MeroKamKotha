import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { PostCard } from "@/components/posts/post-card";
import { PostForm } from "@/components/posts/post-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Bookmark, Building2, Briefcase, UserCircle, ChevronRight, MessageSquare } from "lucide-react";
import type { Post, Chat } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { format } from "date-fns";

type PostWithUsername = Post & { username?: string };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const { data: posts = [] } = useQuery<PostWithUsername[]>({
    queryKey: ["/api/posts"],
  });

  const { data: bookmarkedPosts = [] } = useQuery<PostWithUsername[]>({
    queryKey: ["/api/user/bookmarks"],
    enabled: !!user,
  });

  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: !!user,
  });

  const userPosts = posts.filter(post => post.userId === user?.id);
  const roomPosts = userPosts.filter(post => post.type === "room");
  const jobPosts = userPosts.filter(post => post.type === "job");

  if (!user) return null;

  return (
    <Layout>
      <motion.div 
        className="min-h-screen bg-gradient-to-b from-background via-background/80 to-muted/20 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="container px-4 mx-auto space-y-8">
          {/* Profile Header */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {/* Profile Card */}
            <motion.div variants={item} className="col-span-1">
              <Card className="overflow-hidden bg-gradient-to-br from-card to-muted/5 border-muted-foreground/10 hover:border-primary/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <UserCircle className="h-10 w-10 text-primary/60" />
                      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-primary/10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {user.fullname}
                      </h2>
                      <p className="text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button variant="outline" className="w-full gap-2 group">
                    Edit Profile
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={item} className="col-span-1">
              <Card className="h-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent hover:shadow-md transition-shadow group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    Room Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                    {roomPosts.length}
                  </p>
                  <p className="text-muted-foreground">Active room listings</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item} className="col-span-1">
              <Card className="h-full bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent hover:shadow-md transition-shadow group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                    Job Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
                    {jobPosts.length}
                  </p>
                  <p className="text-muted-foreground">Active job listings</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item} className="col-span-1">
              <Card className="h-full bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent hover:shadow-md transition-shadow group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                    Active Chats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                    {chats.length}
                  </p>
                  <p className="text-muted-foreground">Ongoing conversations</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="posts" className="gap-2 data-[state=active]:bg-primary/20">
                  Your Posts
                </TabsTrigger>
                <TabsTrigger value="bookmarks" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
                  <Bookmark className="h-4 w-4" />
                  Saved Posts ({bookmarkedPosts.length})
                </TabsTrigger>
                <TabsTrigger value="chats" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
                  <MessageSquare className="h-4 w-4" />
                  Chat History ({chats.length})
                </TabsTrigger>
              </TabsList>

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Your Posts
                  </h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2 group">
                        <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />
                        Create New Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <PostForm />
                    </DialogContent>
                  </Dialog>
                </div>

                <AnimatePresence>
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {userPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <PostCard post={post} />
                      </motion.div>
                    ))}
                    {userPosts.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full"
                      >
                        <Card className="p-8 text-center bg-gradient-to-br from-muted/50 to-muted/30">
                          <p className="text-muted-foreground">You haven't created any posts yet.</p>
                          <p className="text-muted-foreground">Click the 'Create New Post' button to get started!</p>
                        </Card>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              {/* Bookmarks Tab */}
              <TabsContent value="bookmarks" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent flex items-center gap-2">
                    <Bookmark className="h-5 w-5" />
                    Saved Posts
                  </h2>
                </div>

                <AnimatePresence>
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {bookmarkedPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <PostCard post={post} inSavedPosts={true} />
                      </motion.div>
                    ))}
                    {bookmarkedPosts.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full"
                      >
                        <Card className="p-8 text-center bg-gradient-to-br from-muted/50 to-muted/30">
                          <p className="text-muted-foreground">You haven't saved any posts yet.</p>
                          <p className="text-muted-foreground">Click the 'Save' button on posts to add them to your bookmarks!</p>
                        </Card>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>

              {/* Chat History Tab */}
              <TabsContent value="chats" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat History
                  </h2>
                  <Button
                    onClick={() => navigate('/chat')}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Open Messages
                  </Button>
                </div>

                <AnimatePresence>
                  <motion.div 
                    layout
                    className="grid grid-cols-1 gap-4"
                  >
                    {chats.map((chat, index) => (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card 
                          className="hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => {
                            navigate('/chat/' + chat.id);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">
                                  Chat with {chat.participants?.filter(p => p.id !== user.id).map(p => p.username).join(", ")}
                                </h3>
                                {chat.lastMessage && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Last message: {format(new Date(chat.lastMessage.createdAt), "PP p")}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    {chats.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Card className="p-8 text-center bg-gradient-to-br from-muted/50 to-muted/30">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No active conversations</p>
                          <p className="text-muted-foreground text-sm">Start chatting with other users to see your chat history here!</p>
                        </Card>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}