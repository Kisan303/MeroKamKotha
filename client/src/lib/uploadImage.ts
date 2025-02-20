import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage(imageDataUrl: string): Promise<string> {
  try {
    // Create a unique filename using timestamp and random string
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const storageRef = ref(storage, `room-images/${filename}`);

    // Upload the image
    await uploadString(storageRef, imageDataUrl, 'data_url');

    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}

export async function uploadMultipleImages(imageDataUrls: string[]): Promise<string[]> {
  try {
    const uploadPromises = imageDataUrls.map(uploadImage);
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw new Error("Failed to upload images");
  }
}
