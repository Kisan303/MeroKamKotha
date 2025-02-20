import { useState, useRef } from "react";
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
import { Loader2, X, ImagePlus } from "lucide-react";
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
import { uploadMultipleImages } from "@/lib/uploadImage";

export function PostForm({ initialData, onSuccess }: {
  initialData?: InsertPost & { id?: number };
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Validate file count
    if (files.length > 5) {
      toast({
        title: "Error",
        description: "Maximum 5 images allowed",
        variant: "destructive",
      });
      return;
    }

    // Clear existing previews
    setPreviews([]);

    // Process each file
    Array.from(files).forEach((file) => {
      // Validate file size
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
        setPreviews((prev) => {
          if (e.target?.result && !prev.includes(e.target.result as string)) {
            return [...prev, e.target.result as string];
          }
          return prev;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      try {
        setIsUploading(true);
        let imageUrls: string[] = [];

        // For room posts, upload images to Firebase
        if (data.type === "room" && previews.length > 0) {
          imageUrls = await uploadMultipleImages(previews);
          console.log("Uploaded image URLs:", imageUrls);
        }

        // Create post with image URLs
        const res = await apiRequest("POST", "/api/posts", {
          ...data,
          images: imageUrls
        });

        if (!res.ok) {
          throw new Error(await res.text() || "Failed to create post");
        }

        return await res.json();
      } catch (error) {
        console.error("Error in create mutation:", error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
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
      console.error("Create post error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertPost) => {
    console.log("Form submitted with data:", data);

    // For room posts, validate images
    if (postType === "room" && previews.length === 0) {
      toast({
        title: "Error",
        description: "At least one image is required for room posts",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add the preview images to the data
      await createMutation.mutateAsync({
        ...data,
        images: previews
      });
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <ScrollArea className="h-[80vh] w-full">
      <div className="space-y-6 px-6">
        <DialogTitle className="text-xl font-semibold">
          {initialData?.id ? "Edit Post" : "Create New Post"}
        </DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="job">Job</SelectItem>
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
                    <Input placeholder="Enter title" {...field} />
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
                      placeholder="Enter description"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{postType === "room" ? "Price (Required)" : "Price (Optional)"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          placeholder="Enter price"
                          className="pl-7"
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
                      {postType === "room" ? "Monthly rent amount (required)" : "Salary (optional)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      City, State or full address
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {postType === "room" && (
              <FormItem>
                <FormLabel>Images (Required)</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                    </div>
                    {previews.length > 0 && (
                      <Card className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {previews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="rounded-md w-full h-48 object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setPreviews(previews.filter((_, i) => i !== index));
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = "";
                                  }
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
                  You must upload 1-5 images for room posts. Each image must be less than 5MB.
                </FormDescription>
                {postType === "room" && previews.length === 0 && (
                  <FormMessage>At least one image is required for room posts</FormMessage>
                )}
              </FormItem>
            )}

            <div className="flex gap-4 justify-end">
              <DialogClose ref={closeButtonRef} asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={createMutation.isPending || isUploading}
              >
                {(createMutation.isPending || isUploading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploading ? "Uploading Images..." : createMutation.isPending ? "Creating Post..." : "Create Post"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <ScrollBar />
    </ScrollArea>
  );
}