import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPostSchema, type InsertPost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, ImagePlus, Building2, Briefcase, DollarSign, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogTitle, DialogClose } from "@/components/ui/dialog";
import { motion } from "framer-motion";

export function PostForm({ initialData, onSuccess }: {
  initialData?: InsertPost & { id?: number };
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  console.log("PostForm rendered with initialData:", initialData);

  const form = useForm<InsertPost>({
    resolver: zodResolver(insertPostSchema),
    defaultValues: initialData || {
      type: "room",
      title: "",
      description: "",
      price: null,
      location: "",
      images: [],
    },
  });

  const postType = form.watch("type");

  useEffect(() => {
    if (postType === "job") {
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [postType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Image input change event triggered");
    const files = e.target.files;
    if (!files) return;

    if (files.length > 5) {
      toast({
        title: "Error",
        description: "Maximum 5 images allowed",
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: `File ${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews((prev) => {
            if (prev.includes(e.target!.result as string)) {
              return prev;
            }
            if (prev.length >= 5) {
              toast({
                title: "Error",
                description: "Maximum 5 images allowed",
                variant: "destructive",
              });
              return prev;
            }
            return [...prev, e.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      console.log("Starting mutation with data:", data);
      try {
        if (data.type === "room" && previews.length === 0) {
          throw new Error("At least one image is required for room posts");
        }

        const postData = {
          ...data,
          images: data.type === "room" ? previews : [],
        };

        console.log("Sending post data to server:", postData);
        const res = await apiRequest("POST", "/api/posts", postData);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Server error response:", errorText);
          throw new Error(errorText || "Failed to create post");
        }

        const result = await res.json();
        console.log("Post created successfully:", result);
        return result;
      } catch (error) {
        console.error("Mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Mutation succeeded, cleaning up form");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      form.reset();
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      closeButtonRef.current?.click();
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertPost) => {
    console.log("Form submission triggered with data:", data);
    console.log("Form validation state:", form.formState);

    try {
      if (data.type === "room" && previews.length === 0) {
        console.log("Validation failed: No images for room post");
        toast({
          title: "Error",
          description: "At least one image is required for room posts",
          variant: "destructive",
        });
        return;
      }

      console.log("Calling mutation with data...");
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  console.log("Current form state:", form.formState);
  console.log("Form errors:", form.formState.errors);

  return (
    <ScrollArea className="h-[80vh] w-full">
      <div className="space-y-6 px-6">
        <DialogTitle className="text-xl font-bold">
          {initialData?.id ? "Edit Post" : "Create New Post"}
        </DialogTitle>

        <Form {...form}>
          <form 
            onSubmit={(e) => {
              console.log("Raw form submit event triggered");
              form.handleSubmit(onSubmit)(e);
            }} 
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium">What are you posting?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background/50 backdrop-blur-sm border-muted-foreground/20">
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="room" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Room for Rent</span>
                      </SelectItem>
                      <SelectItem value="job" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>Job Opportunity</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={postType === "room" ? "e.g., Cozy Studio in Downtown" : "e.g., Senior Software Engineer"} 
                      className="bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        postType === "room"
                          ? "Describe the room, amenities, and requirements..."
                          : "Describe the role, requirements, and company benefits..."
                      }
                      className="min-h-[120px] bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-muted-foreground/10 p-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        {postType === "room" ? "Monthly Rent" : "Salary Range"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            className="pl-7 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? Number(value) : null);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {postType === "room" ? "Required for room listings" : "Optional for job posts"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-muted-foreground/10 p-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-500" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="City, State or Address" 
                          className="bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the location details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            </motion.div>

            {postType === "room" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-muted-foreground/10 rounded-lg p-6"
              >
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5 text-green-500" />
                    Room Photos
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          className="cursor-pointer bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          className="group"
                        >
                          <ImagePlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                        </Button>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card className="p-4 bg-card/50 backdrop-blur-sm">
                          <div className="grid grid-cols-2 gap-4">
                            {previews.map((preview, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group rounded-lg overflow-hidden"
                              >
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="rounded-md w-full h-48 object-cover transition-all duration-300 group-hover:brightness-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0"
                                  onClick={() => {
                                    setPreviews(previews.filter((_, i) => i !== index));
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </Card>
                      </motion.div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload 1-5 high-quality images (max 5MB each)
                  </FormDescription>
                  {postType === "room" && previews.length === 0 && (
                    <FormMessage>At least one image is required for room posts</FormMessage>
                  )}
                </FormItem>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4 justify-end"
            >
              <DialogClose ref={closeButtonRef} asChild>
                <Button 
                  type="button" 
                  variant="outline"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                onClick={() => console.log("Submit button clicked")}
                className="bg-primary"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}