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

export function PostForm({ initialData, onSuccess }: {
  initialData?: InsertPost & { id?: number };
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
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

  // Effect to handle room type changes
  useEffect(() => {
    if (postType === "job") {
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [postType]);

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

    // Process each file
    Array.from(files).forEach((file) => {
      // Validate file size (5MB)
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
            // Check if we already have this image
            if (prev.includes(e.target!.result as string)) {
              return prev;
            }
            // Limit to 5 images
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
      try {
        console.log("Form submitted with data:", data);

        // For room posts, validate images
        if (data.type === "room" && previews.length === 0) {
          throw new Error("At least one image is required for room posts");
        }

        // Prepare the post data
        const postData = {
          ...data,
          images: data.type === "room" ? previews : []
        };

        console.log("Sending post data:", postData);

        const res = await apiRequest("POST", "/api/posts", postData);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Server response error:", errorText);
          throw new Error(errorText || "Failed to create post");
        }

        const result = await res.json();
        console.log("Post created successfully:", result);
        return result;
      } catch (error) {
        console.error("Error in create mutation:", error);
        throw error;
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
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createMutation.isPending ? "Creating Post..." : "Create Post"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <ScrollBar />
    </ScrollArea>
  );
}