import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPostSchema, type InsertPost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, ImagePlus, Building2, Briefcase, DollarSign, MapPin } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

export function PostForm({ initialData, onSuccess }: {
  initialData?: InsertPost & { id?: number };
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [files, setFiles] = useState<File[]>([]);

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
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [postType]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Image input change triggered");
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    if (selectedFiles.length > 5) {
      toast({
        title: "Error",
        description: "Maximum 5 images allowed",
        variant: "destructive",
      });
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
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
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === selectedFiles.length) {
            setPreviews(newPreviews);
          }
        }
      };
      reader.readAsDataURL(file);
      newFiles.push(file);
    });

    setFiles(newFiles);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      console.log("Starting mutation with data:", data);

      if (data.type === "room") {
        if (files.length === 0) {
          throw new Error("At least one image is required for room posts");
        }

        // Create FormData to send files
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('images', file);
        });

        // Add other post data
        formData.append('type', data.type);
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('price', data.price?.toString() || '');
        formData.append('location', data.location);

        console.log("Sending post data with images");
        const res = await fetch('/api/posts', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Server error response:", errorText);
          throw new Error(errorText || "Failed to create post");
        }

        return await res.json();
      } else {
        // For job posts (no images)
        const res = await apiRequest("POST", "/api/posts", data);
        if (!res.ok) {
          throw new Error("Failed to create post");
        }
        return await res.json();
      }
    },
    onSuccess: () => {
      console.log("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      form.reset();
      setPreviews([]);
      setFiles([]);
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

    try {
      // Validate required fields for room posts
      if (data.type === "room") {
        if (!data.title.trim()) {
          toast({
            title: "Error",
            description: "Title is required",
            variant: "destructive",
          });
          return;
        }
        if (!data.description.trim()) {
          toast({
            title: "Error",
            description: "Description is required",
            variant: "destructive",
          });
          return;
        }
        if (!data.location.trim()) {
          toast({
            title: "Error",
            description: "Location is required",
            variant: "destructive",
          });
          return;
        }
        if (!data.price || data.price <= 0) {
          toast({
            title: "Error",
            description: "Please enter a valid price",
            variant: "destructive",
          });
          return;
        }
        if (files.length === 0) {
          toast({
            title: "Error",
            description: "At least one image is required for room posts",
            variant: "destructive",
          });
          return;
        }
      }

      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <ScrollArea className="h-[80vh] w-full">
      <div className="space-y-6 px-6">
        <DialogTitle className="text-xl font-bold">
          {initialData?.id ? "Edit Post" : "Create New Post"}
        </DialogTitle>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Form submit triggered");
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {postType === "room" && (
              <div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-muted-foreground/10 rounded-lg p-6">
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
                      </div>

                      {previews.length > 0 && (
                        <Card className="p-4 bg-card/50 backdrop-blur-sm">
                          <div className="grid grid-cols-2 gap-4">
                            {previews.map((preview, index) => (
                              <div
                                key={index}
                                className="relative group rounded-lg overflow-hidden"
                              >
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="rounded-md w-full h-48 object-cover transition-all duration-300 group-hover:brightness-110"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                  onClick={() => {
                                    setPreviews(previews.filter((_, i) => i !== index));
                                    setFiles(files.filter((_, i) => i !== index));
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload 1-5 high-quality images (max 5MB each)
                  </FormDescription>
                  {postType === "room" && previews.length === 0 && (
                    <FormMessage>At least one image is required for room posts</FormMessage>
                  )}
                </FormItem>
              </div>
            )}

            <div className="flex gap-4 justify-end">
              <DialogClose ref={closeButtonRef} asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={createMutation.isPending}
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
            </div>
          </form>
        </Form>
      </div>
      <ScrollBar />
    </ScrollArea>
  );
}