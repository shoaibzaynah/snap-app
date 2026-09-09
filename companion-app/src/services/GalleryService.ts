// companion-app/src/services/GalleryService.ts
import { NativeModules, Platform } from "react-native";

const { FileManagerModule } = NativeModules;

export interface GalleryFile {
  file_name: string;
  file_path: string;
  file_type: "image" | "video" | "audio" | "document" | "other";
  file_size_bytes: number;
  mime_type: string;
  thumbnail_path?: string;
}

export async function fetchGalleryFiles(): Promise<GalleryFile[]> {
  try {
    if (Platform.OS === "android" && FileManagerModule?.indexMediaFiles) {
      const jsonString = await FileManagerModule.indexMediaFiles(500);
      const files = JSON.parse(jsonString);
      
      return files.map((file: any) => {
        const mimeType = file.mime_type || "";
        let fileType: GalleryFile["file_type"] = "other";
        
        if (mimeType.startsWith("image/")) fileType = "image";
        else if (mimeType.startsWith("video/")) fileType = "video";
        else if (mimeType.startsWith("audio/")) fileType = "audio";
        else if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) fileType = "document";
        
        return {
          file_name: file.file_name,
          file_path: file.file_path,
          file_type: fileType,
          file_size_bytes: file.file_size_bytes || 0,
          mime_type: mimeType,
        };
      });
    }
    return [];
  } catch (err) {
    console.error("Error fetching gallery files", err);
    return [];
  }
}

export async function openFileStream(path: string): Promise<string | null> {
  try {
    if (Platform.OS === "android" && FileManagerModule?.openFileStream) {
      // This would need a different approach for React Native
      // For now, return the content URI
      return path;
    }
    return null;
  } catch (err) {
    console.error("Error opening file stream", err);
    return null;
  }
}